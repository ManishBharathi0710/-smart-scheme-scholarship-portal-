#!/usr/bin/env bash
set -e

# Change directory to project root
cd "$(dirname "$0")"

MODE="${1:-dev}"

echo "=================================================="
echo "  Smart Scheme & Scholarship Recommendation Portal"
echo "=================================================="

if [ "$MODE" = "prod" ] || [ "$MODE" = "serve" ]; then
  echo "🚀 Building and starting unified fullstack application..."
  npm run build
  echo "🌐 Starting server on http://localhost:5001"
  npm --prefix backend run start
else
  echo "⚡ Starting frontend and backend concurrently in development mode..."
  echo "Backend API: http://localhost:5001"
  echo "Frontend UI: http://localhost:5173"
  npm run dev
fi

