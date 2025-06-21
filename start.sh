#!/bin/bash

echo "🚀 Starting Washing Machine Management System..."

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo "Killing process on port $port..."
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
}

# Kill any existing processes on our ports
kill_port 3002
kill_port 5173

echo "📦 Installing dependencies..."

# Install API dependencies
if [ ! -d "api/node_modules" ]; then
    echo "Installing API dependencies..."
    cd api && npm install && cd ..
fi

# Install frontend dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "🗄️ Initializing database..."
cd api && node -e "
const { initializeDatabase } = require('./db');
initializeDatabase().then(() => {
    console.log('✅ Database initialized successfully');
    process.exit(0);
}).catch(err => {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
});
" && cd ..

echo "🔧 Starting API server..."
cd api && node index.js &
API_PID=$!
cd ..

# Wait for API to start
echo "⏳ Waiting for API server to start..."
for i in {1..30}; do
    if check_port 3002; then
        echo "✅ API server is running on port 3002"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ API server failed to start"
        kill $API_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

echo "🎨 Starting frontend development server..."
cd /Users/lanlh/house && npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend server to start..."
for i in {1..30}; do
    if check_port 5173; then
        echo "✅ Frontend server is running on port 5173"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Frontend server failed to start"
        kill $API_PID $FRONTEND_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

echo ""
echo "🎉 System started successfully!"
echo "📍 Frontend: http://localhost:5173"
echo "📍 API: http://localhost:3002"
echo "📍 API Health: http://localhost:3002/api/health"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $API_PID $FRONTEND_PID 2>/dev/null
    kill_port 3002
    kill_port 5173
    echo "✅ All servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Wait for user to stop
wait 