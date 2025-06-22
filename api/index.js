const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
// Fly.io auto-assigns PORT via environment variable
const PORT = process.env.PORT || 3002

// Middleware
app.use(cors())
app.use(express.json())

// Import API handlers
const machineStateHandler = require('./machine-state')
const historyHandler = require('./history')
const queueHandler = require('./queue')
const machinesHandler = require('./machines')
const roomsHandler = require('./rooms')

// Routes
app.use('/api/machine-state', machineStateHandler) // Backwards compatibility
app.use('/api/machines', machinesHandler)
app.use('/api/rooms', roomsHandler)
app.use('/api/history', historyHandler)
app.use('/api/queue', queueHandler)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Washing Machine API is running',
    timestamp: new Date().toISOString()
  })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Washing Machine Manager API',
    version: '2.0.0',
    endpoints: {
      health: '/api/health',
      // New structured endpoints
      machines: '/api/machines',
      rooms: '/api/rooms',
      history: '/api/history',
      queue: '/api/queue',
      // Legacy endpoints
      machineState: '/api/machine-state'
    },
    features: [
      'Machine management',
      'Room management',
      'Queue system',
      'History tracking',
      'IP-based access control'
    ]
  })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error)
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  })
})

// Start server only in non-serverless environment
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Washing Machine API server running on port ${PORT}`)
    console.log(`📍 Local: http://localhost:${PORT}`)
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`)
    console.log(`🤖 Machines: http://localhost:${PORT}/api/machines`)
    console.log(`🏠 Rooms: http://localhost:${PORT}/api/rooms`)
    console.log(`📊 Machine state (legacy): http://localhost:${PORT}/api/machine-state`)
    console.log(`📝 History: http://localhost:${PORT}/api/history`)
    console.log(`🔄 Queue: http://localhost:${PORT}/api/queue`)
  })
}

// Export for Vercel serverless
module.exports = app 
