#!/bin/bash

# GeneaIA Development Server Script
set -e

echo "🚀 Starting GeneaIA Development Environment..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if npm is available
if ! command_exists npm; then
    echo "❌ npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Check if node_modules exist and install if not
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Function to kill processes on exit
cleanup() {
    echo "🛑 Shutting down development servers..."
    kill $(jobs -p) 2>/dev/null || true
}
trap cleanup EXIT

# Start backend server
echo "🔧 Starting backend server on port 3001..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🌐 Starting frontend server on port 5173..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo "✅ Development servers started!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for any process to exit
wait
