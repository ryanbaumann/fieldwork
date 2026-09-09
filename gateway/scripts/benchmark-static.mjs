// Local synthetic HTTP benchmark, not a production capacity estimate.
// node gateway/scripts/benchmark-static.mjs --module gateway/lib/staticFiles.js --out /tmp/current.json
// Save an earlier staticFiles.js as an .mjs file and use --module for comparison.
import http from 'node:http';
import { fork, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync, utimesSync } from 'node:fs';
import { cpus, freemem, loadavg, platform, release, tmpdir, totalmem } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';

const self = fileURLToPath(import.meta.url);
const options = new Map();
for (let index = 2; index < process.argv.length; index += 2) options.set(process.argv[index], process.argv[index + 1]);
const html = '<!doctype html><title>Fixture</title>' + '<p>Static benchmark content with repeated HTML structure.</p>'.repeat(1024);
const json = JSON.stringify(Array.from({ length: 1000 }, (_, id) => ({ id, label: `Fixture ${id}`, value: id % 17 })));

if (options.has('--serve')) {
  const { serveFromDir, serveFileWithStatus, sendCompressibleBody } = await import(pathToFileURL(options.get('--module')));
  const dir = options.get('--serve');
  const server = http.createServer((req, res) => {
    if (req.url === '/generated-html' || req.url === '/generated-json') {
      sendCompressibleBody(req, res, 200, { 'Content-Type': req.url.endsWith('json') ? 'application/json' : 'text/html', 'Cache-Control': 'no-store' }, req.url.endsWith('json') ? json : html);
    } else if (!serveFromDir(dir, ['/conditional', '/head'].includes(req.url) ? '/index.html' : req.url, req, res)) {
      serveFileWithStatus(join(dir, 'index.html'), req, res, 404);
    }
  });
  const histogram = monitorEventLoopDelay({ resolution: 10 });
  histogram.enable();
  let cpu;
  let peakRss = process.memoryUsage().rss;
  const memoryTimer = setInterval(() => { peakRss = Math.max(peakRss, process.memoryUsage().rss); }, 20);
  process.on('message', (message) => {
    if (message === 'start') {
      cpu = process.cpuUsage(); histogram.reset(); peakRss = process.memoryUsage().rss;
      process.send({ ready: true });
    } else if (message === 'stop') {
      process.send({ cpu: process.cpuUsage(cpu), memory: process.memoryUsage(), peakRss,
        eventLoopMs: { median: histogram.percentile(50) / 1e6, p95: histogram.percentile(95) / 1e6, max: histogram.max / 1e6 } });
    } else if (message === 'close') {
      clearInterval(memoryTimer); histogram.disable(); server.close(() => process.disconnect());
    }
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  process.send({ port: server.address().port });
} else {
  const modulePath = resolve(options.get('--module') || join(dirname(self), '../lib/staticFiles.js'));
  const durationMs = Number(options.get('--duration-ms') || 300);
  if (!Number.isFinite(durationMs) || durationMs < 100) throw new Error('--duration-ms must be at least 100');
  const dir = mkdtempSync(join(tmpdir(), 'gateway-benchmark-'));
  const image = Buffer.alloc(96 * 1024);
  let seed = 0x12345678;
  for (let index = 0; index < image.length; index++) {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; image[index] = seed & 255;
  }
  const fixtures = { 'index.html': html, 'bundle.js': 'export const entries = ' + json + ';\n', 'data.json': json, 'image.png': image };
  const fixtureMetadata = {};
  for (const [name, contents] of Object.entries(fixtures)) {
    writeFileSync(join(dir, name), contents); utimesSync(join(dir, name), 1_700_000_000, 1_700_000_000);
    fixtureMetadata[name] = { bytes: Buffer.byteLength(contents), sha256: createHash('sha256').update(contents).digest('hex') };
  }
  const child = fork(self, ['--serve', dir, '--module', modulePath], {
    execArgv: [], env: { PATH: process.env.PATH, NODE_ENV: 'test' }, stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
  });
  const receive = () => new Promise((done, fail) => {
    const onExit = () => fail(new Error('benchmark server exited'));
    child.once('exit', onExit); child.once('message', (message) => { child.off('exit', onExit); done(message); });
  });
  const command = async (message) => { const response = receive(); child.send(message); return response; };
  const agent = new http.Agent({ keepAlive: true, maxSockets: 50 });
  const results = [];
  const startingLoadAverage = loadavg();
  try {
    const { port } = await receive();
    const request = (path, encoding, etag) => new Promise((done) => {
      const start = performance.now();
      const headers = { 'Accept-Encoding': encoding };
      if (etag) headers['If-None-Match'] = etag;
      const req = http.get({ hostname: '127.0.0.1', port, path, headers, agent, method: path === '/head' ? 'HEAD' : 'GET' }, (res) => {
        let bytes = 0;
        res.on('data', (chunk) => { bytes += chunk.length; });
        res.on('error', () => done({ error: true, ms: performance.now() - start }));
        res.on('end', () => done({ ms: performance.now() - start, bytes, status: res.statusCode, etag: res.headers.etag }));
      });
      req.setTimeout(10_000, () => req.destroy());
      req.on('error', () => done({ error: true, ms: performance.now() - start }));
    });
    const { etag } = await request('/index.html', 'identity');
    const cases = ['/index.html', '/bundle.js', '/data.json', '/image.png', '/generated-html', '/generated-json', '/missing', '/conditional', '/head'];
    // Warm every route/encoding before measurements, then warm each batch for 30 requests.
    for (const path of cases) for (const encoding of ['identity', 'gzip', 'br']) {
      for (let count = 0; count < 10; count++) await request(path, encoding, path === '/conditional' ? etag : undefined);
    }
    for (let run = 1; run <= 3; run++) for (const concurrency of [1, 10, 50]) {
      for (const path of cases) for (const encoding of ['identity', 'gzip', 'br']) {
        for (let count = 0; count < 30; count++) await request(path, encoding, path === '/conditional' ? etag : undefined);
        await command('start');
        const start = performance.now();
        const samples = [];
        await Promise.all(Array.from({ length: concurrency }, async () => {
          do { samples.push(await request(path, encoding, path === '/conditional' ? etag : undefined)); }
          while (performance.now() - start < durationMs);
        }));
        const elapsedMs = performance.now() - start;
        const metrics = await command('stop');
        const times = samples.map((sample) => sample.ms).sort((a, b) => a - b);
        const expectedStatus = path === '/missing' ? 404 : path === '/conditional' ? 304 : 200;
        results.push({ run, concurrency, path, encoding, elapsedMs, requests: samples.length,
          requestsPerSecond: samples.length * 1000 / elapsedMs,
          medianMs: times[Math.floor(times.length * 0.5)], p95Ms: times[Math.min(times.length - 1, Math.floor(times.length * 0.95))],
          errors: samples.filter((sample) => sample.error || sample.status !== expectedStatus).length,
          bytes: samples.reduce((sum, sample) => sum + (sample.bytes || 0), 0), ...metrics, latencySamplesMs: times });
      }
    }
    const report = { schema: 1, timestamp: new Date().toISOString(),
      commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', cwd: join(dirname(self), '../..') }).trim(),
      modulePath, moduleSha256: createHash('sha256').update(readFileSync(modulePath)).digest('hex'), node: process.version,
      machine: { platform: platform(), release: release(), cpus: cpus().length, model: cpus()[0].model,
        totalMemory: totalmem(), freeMemory: freemem(), startingLoadAverage, endingLoadAverage: loadavg(),
        cgroupCpuMax: existsSync('/sys/fs/cgroup/cpu.max') ? readFileSync('/sys/fs/cgroup/cpu.max', 'utf8').trim() : null,
        cgroupMemoryMax: existsSync('/sys/fs/cgroup/memory.max') ? readFileSync('/sys/fs/cgroup/memory.max', 'utf8').trim() : null },
      settings: { durationMs, measuredRuns: 3, concurrency: [1, 10, 50], warmupRequestsPerCase: 10, warmupRequestsPerBatch: 30,
        brotliQuality: 5, gzipLevel: 6, keepAlive: true, serverCpuSeparateFromClient: true, filesystem: 'temporary fixtures; warm page cache' },
      fixtures: fixtureMetadata, results };
    const output = JSON.stringify(report, null, 2) + '\n';
    if (options.has('--out')) writeFileSync(resolve(options.get('--out')), output);
    else process.stdout.write(output);
    process.stderr.write(`Measured ${results.length} batches; ${results.reduce((sum, row) => sum + row.requests, 0)} requests; ${results.reduce((sum, row) => sum + row.errors, 0)} errors.\n`);
  } finally {
    agent.destroy();
    if (child.connected) child.send('close');
    await new Promise((done) => child.exitCode !== null ? done() : child.once('exit', done));
    rmSync(dir, { recursive: true, force: true });
  }
}
