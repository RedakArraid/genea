#!/bin/bash

# GeneaIA Development Server Script (Python Backend)
set -e

echo "🚀 Starting GeneaIA Development Environment (Python Backend)..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

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

# Pour l'instant, on démarre seulement le frontend
# Le backend Python nécessite des dépendances supplémentaires

# Start frontend server
echo "🌐 Starting frontend server on port 5173..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo "✅ Development servers started!"
echo "📱 Frontend: http://localhost:5173"
echo "⚠️  Backend Python en cours de configuration..."
echo ""
echo "Press Ctrl+C to stop the server"

# Wait for any process to exit
wait
