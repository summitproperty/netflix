#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# start-local.sh - run Nafij Netflix locally on macOS or Linux.
#
#   chmod +x start-local.sh   # once
#   ./start-local.sh
#
# It runs the setup check (Node version, .env.local, dependencies) and then
# starts the dev server. Safe to run repeatedly: setup never overwrites an
# existing .env.local and never reinstalls when node_modules is already there.
#
# Press Ctrl+C to stop the server.
# ---------------------------------------------------------------------------
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo
  echo "Node.js was not found on this machine."
  echo "Install the current LTS from https://nodejs.org and run this again."
  echo
  exit 1
fi

echo
echo "=== Nafij Netflix : local setup ==="
npm run setup

echo
echo "=== Starting the dev server ==="
echo "Open http://localhost:3000 in your browser once it says \"Ready\"."
echo "Press Ctrl+C to stop it."
echo

# Open the browser by itself a few seconds later, once Next.js is compiling.
# If it opens too early just refresh the tab - the server is still starting.
if command -v open >/dev/null 2>&1; then
  ( sleep 12; open http://localhost:3000 >/dev/null 2>&1 || true ) &
elif command -v xdg-open >/dev/null 2>&1; then
  ( sleep 12; xdg-open http://localhost:3000 >/dev/null 2>&1 || true ) &
fi

npm run dev
