#!/bin/bash
echo "=========================================="
echo "🚀 Samsara Pulse Enterprise v4.0 Launcher"
echo "=========================================="

BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$BASE_DIR"

echo "1. Checking SQLite Database..."
if [ ! -f "server/fleet.db" ]; then
    echo "Building database from seeds..."
    python3 server/db_builder.py
fi

echo "2. Starting Python API Server on port 8085..."
python3 server/server.py &
SERVER_PID=$!

echo "3. Starting Frontend Preview Server on port 5173..."
cd frontend
npm run preview -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

echo "=========================================="
echo "✅ Samsara Pulse is LIVE!"
echo "➡️  Frontend: http://localhost:5173"
echo "➡️  API Backend: http://localhost:8085"
echo "=========================================="

trap "kill $SERVER_PID $FRONTEND_PID" EXIT
wait
