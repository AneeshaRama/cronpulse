#!/bin/sh
set -e

echo "[cronpulse] Running database migrations..."
node migrate.mjs

echo "[cronpulse] Starting server..."
exec node server.js
