#!/bin/bash

# Start backend in background
echo "Starting backend..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend in background
echo "Starting frontend..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Function to cleanup processes
cleanup() {
    echo "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Backend running on http://localhost:3011"
echo "Frontend running on http://localhost:5173"
echo "Press Ctrl+C to stop all services"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
