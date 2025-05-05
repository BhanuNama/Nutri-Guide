#!/bin/bash

# Title
echo "====================================="
echo "  Starting Neutro Application"
echo "====================================="
echo ""

# Start the backend server
echo "Starting backend server on port 3000..."
cd backend
npm run start:dev &
BACKEND_PID=$!
echo "Backend server started with PID: $BACKEND_PID"
echo ""

# Give the backend server some time to start
sleep 3

# Start the frontend server
echo "Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend server started with PID: $FRONTEND_PID"
echo ""

echo "The Neutro application is now running!"
echo "- Backend: http://localhost:3000"
echo "- Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Handle graceful shutdown
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; echo 'Servers stopped.'; exit" INT

# Keep the script running
wait 