const SOURCE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ACTIONS = new Set(['publish-now', 'schedule', 'draft']);

function validPublishAt(value, now) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?Z$/);
  if (!match) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf()) || parsed.valueOf() <= now.valueOf()) return false;
  const [, year, month, day, hour, minute, second = '0', fraction = '0'] = match;
  return parsed.getUTCFullYear() === Number(year)
    && parsed.getUTCMonth() + 1 === Number(month)
    && parsed.getUTCDate() === Number(day)
    && parsed.getUTCHours() === Number(hour)
    && parsed.getUTCMinutes() === Number(minute)
    && parsed.getUTCSeconds() === Number(second)
    && parsed.getUTCMilliseconds() === Number(fraction.padEnd(3, '0'));
}

function setFrontMatterValue(lines, key, value) {
  const prefix = `${key}:`;
  const index = lines.findIndex((line) => line.startsWith(prefix));
  if (value === null) {
    if (index >= 0) lines.splice(index, 1);
    return;
  }
  const next = `${key}: ${value}`;
  if (index >= 0) lines[index] = next;
  else lines.push(next);
}

export function updatePublishingFrontMatter(markdown, action, publishAt = '', now = new Date()) {
  if (!ACTIONS.has(action)) throw Object.assign(new Error('Unknown publishing action.'), { statusCode: 400 });
  if (!markdown.startsWith('---\n')) throw Object.assign(new Error('Essay is missing front matter.'), { statusCode: 422 });
  const end = markdown.indexOf('\n---', 4);
  if (end < 0) throw Object.assign(new Error('Essay front matter is not closed.'), { statusCode: 422 });
  if (action === 'schedule' && !validPublishAt(publishAt, now)) {
    throw Object.assign(new Error('Choose a valid future publish time.'), { statusCode: 400 });
  }

  const lines = markdown.slice(4, end).split('\n');
  if (action === 'draft') {
    setFrontMatterValue(lines, 'draft', 'true');
    setFrontMatterValue(lines, 'noindex', 'true');
    setFrontMatterValue(lines, 'publishAt', null);
  } else {
    setFrontMatterValue(lines, 'draft', 'false');
    setFrontMatterValue(lines, 'noindex', 'false');
    setFrontMatterValue(lines, 'publishAt', action === 'schedule' ? publishAt : null);
  }
  return `---\n${lines.join('\n')}\n---${markdown.slice(end + 4)}`;
}

export async function publishWritingUpdate({ sourceSlug, action, publishAt, env = process.env, fetchImpl = fetch, now = new Date() }) {
  if (!SOURCE_SLUG.test(sourceSlug || '')) throw Object.assign(new Error('Invalid essay slug.'), { statusCode: 400 });
  if (!ACTIONS.has(action)) throw Object.assign(new Error('Unknown publishing action.'), { statusCode: 400 });

  const token = env.GITHUB_CONTENT_TOKEN;
  const repository = env.GITHUB_CONTENT_REPOSITORY || 'ryanbaumann/Portfolio';
  const branch = env.GITHUB_CONTENT_BRANCH || 'main';
  if (!token) throw Object.assign(new Error('Writer publishing is not configured.'), { statusCode: 503 });
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw Object.assign(new Error('Writer repository configuration is invalid.'), { statusCode: 503 });
  }

  const path = `portfolio/content/writing/${sourceSlug}.md`;
  const url = `https://api.github.com/repos/${repository}/contents/${path}`;
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const current = await fetchImpl(`${url}?ref=${encodeURIComponent(branch)}`, {
    headers,
    signal: AbortSignal.timeout(10_000),
  });
  if (!current.ok) throw Object.assign(new Error('Could not load the essay from GitHub.'), { statusCode: current.status === 404 ? 404 : 502 });
  const file = await current.json();
  const markdown = Buffer.from(file.content || '', 'base64').toString('utf8');
  const updated = updatePublishingFrontMatter(markdown, action, publishAt, now);
  const commitLabel = action === 'draft' ? 'Keep' : action === 'schedule' ? 'Schedule' : 'Publish';

  const saved = await fetchImpl(url, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `${commitLabel} ${sourceSlug}`,
      content: Buffer.from(updated).toString('base64'),
      sha: file.sha,
      branch,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!saved.ok) {
    const statusCode = [403, 409, 422].includes(saved.status) ? saved.status : 502;
    const message = saved.status === 403 || saved.status === 422
      ? 'GitHub rejected the update. Check the token permission and branch rules.'
      : saved.status === 409
        ? 'The essay changed in GitHub. Reload the writer page and try again.'
        : 'GitHub did not accept the publishing update.';
    throw Object.assign(new Error(message), { statusCode });
  }
  return { action, sourceSlug, publishAt: action === 'schedule' ? publishAt : null };
}
