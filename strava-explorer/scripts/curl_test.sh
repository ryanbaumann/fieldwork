#!/bin/bash
set -e

echo "Starting Vite preview server in background on port 4173..."
npx vite preview --port 4173 &
SERVER_PID=$!

# Ensure the server process is killed on exit
cleanup() {
  echo "Stopping Vite preview server (PID: $SERVER_PID)..."
  kill $SERVER_PID || true
}
trap cleanup EXIT

echo "Waiting for server to start..."
for i in {1..10}; do
  if curl -s http://localhost:4173 > /dev/null; then
    echo "Server is up on port 4173!"
    break
  fi
  sleep 1
done

echo "Fetching page content..."
HTML_CONTENT=$(curl -s http://localhost:4173)

echo "Verifying page content..."
if echo "$HTML_CONTENT" | grep -q "<title>Trails Ninja - 3D Strava Explorer</title>"; then
  echo "✅ PASS: Title is correct."
else
  echo "❌ FAIL: Title is missing or incorrect."
  echo "Returned HTML content was:"
  echo "$HTML_CONTENT"
  exit 1
fi

if echo "$HTML_CONTENT" | grep -q "assets/index" || echo "$HTML_CONTENT" | grep -q "assets/dist"; then
  echo "✅ PASS: Main bundle assets are referenced."
else
  echo "❌ FAIL: Main bundle assets not found."
  echo "Returned HTML content was:"
  echo "$HTML_CONTENT"
  exit 1
fi

echo "✅ All local sanity tests passed successfully!"
