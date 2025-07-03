// Utility functions for IP handling and common middleware

// Get client IP from request
const getClientIP = (req) => {
  let ip = req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.ip ||
           '127.0.0.1'
  
  // Convert IPv6 localhost to IPv4
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1'
  }
  
  // If it's an IPv6-mapped IPv4 address, extract the IPv4 part
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7)
  }
  
  return ip
}

// Middleware to add client IP to request
const addClientIP = (req, res, next) => {
  req.clientIP = getClientIP(req)
  next()
}

// Error handling middleware
const errorHandler = (error, req, res, next) => {
  console.error('API Error:', error)
  
  // Handle specific error types
  if (error.message === 'Machine not found') {
    return res.status(404).json({ error: error.message })
  }
  
  if (error.message === 'Machine is not available') {
    return res.status(400).json({ error: error.message })
  }
  
  if (error.message === 'IP already in queue') {
    return res.status(400).json({ error: error.message })
  }
  
  // Default error response
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  })
}

// Async wrapper to catch errors in async route handlers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

module.exports = {
  getClientIP,
  addClientIP,
  errorHandler,
  asyncHandler
}
