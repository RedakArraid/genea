#!/bin/bash

# GeneaIA Development Server Script (Python Backend)
set -e

echo "🚀 Starting GeneaIA Development Environment (Python Backend)..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if python and pip are available
if ! command_exists python3; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

if ! command_exists pip; then
    echo "❌ pip is not installed. Please install pip first."
    exit 1
fi

# Check and install Python backend dependencies
if [ ! -d "backend-python/app" ]; then
    echo "❌ Backend Python directory not found!"
    exit 1
fi

echo "📦 Installing Python backend dependencies..."
cd backend-python && pip install -r requirements.txt && cd ..

# Check if frontend dependencies exist and install if not
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

# Start Python backend server
echo "🔧 Starting Python backend server on port 3001..."
cd backend-python && python -m uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🌐 Starting frontend server on port 5173..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo "✅ Development servers started!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend (Python): http://localhost:3001"
echo "📚 API Documentation: http://localhost:3001/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for any process to exit
wait
