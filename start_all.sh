#!/bin/bash

# Exit on any failure
set -e

echo "Starting Assignment 1 (Backend on 8445, DB on 5434)..."
cd assignment1-rust-backend
docker-compose down
docker-compose up -d --build
cd ..

echo -n "Waiting for Rust backend to compile, migrate, and start"
TIMEOUT_SECONDS=120
ELAPSED=0
until curl -k -s -f -o /dev/null https://localhost:8445/certificates; do
  echo -n "."
  sleep 2
  ELAPSED=$((ELAPSED + 2))
  if [ $ELAPSED -ge $TIMEOUT_SECONDS ]; then
    echo ""
    echo "ERROR: Rust backend failed to start within $TIMEOUT_SECONDS seconds. Aborting frontend startup."
    exit 1
  fi
done
echo ""
echo "Rust backend is ready and responding!"


echo "Starting Assignment 2 (Frontend on 3000, connecting to Backend on 8445)..."
cd assignment2-fullstack-integration/frontend
npm install
export PORT=3000
export BACKEND_URL=https://localhost:8445
nohup npm run dev > ../assignment2.log 2>&1 &
cd ../..

echo "Starting Assignment 3 (Frontend on 3001)..."
cd assignment3-nextjs-inventory/frontend
npm install
export PORT=3001
nohup npm run dev > ../assignment3.log 2>&1 &
cd ../..

echo ""
echo "=========================================="
echo "All assignments have been started!"
echo "=========================================="
echo "- Assignment 1: Backend at https://localhost:8445"
echo "- Assignment 2: Frontend at http://localhost:3000"
echo "- Assignment 3: Frontend at http://localhost:3001"
echo "=========================================="
echo "Note: Assignment 2 and 3 are running in the background."
echo "Check logs in assignment2-fullstack-integration/assignment2.log and assignment3-nextjs-inventory/assignment3.log."
