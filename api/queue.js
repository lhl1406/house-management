const express = require('express')
const { 
  getQueue, 
  addToQueue, 
  removeFromQueue, 
  getNextInQueue 
} = require('./data')

const router = express.Router()

// Middleware to get client IP
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

// GET /api/queue - Get current queue
router.get('/', async (req, res) => {
  try {
    const clientIP = getClientIP(req)
    const queue = await getQueue()
    
    res.json({
      queue,
      clientIP,
      isInQueue: queue.some(item => item.ipAddress === clientIP)
    })
  } catch (error) {
    console.error('Error getting queue:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/queue/join - Join queue
router.post('/join', async (req, res) => {
  try {
    const clientIP = getClientIP(req)
    const { room, phoneNumber } = req.body
    
    if (!room) {
      return res.status(400).json({ error: 'Room is required' })
    }
    
    // Check if IP is already in queue
    const currentQueue = await getQueue()
    if (currentQueue.some(item => item.ipAddress === clientIP)) {
      return res.status(400).json({ error: 'IP already in queue' })
    }
    
    // Add to queue - ensure machineType is always set
    const queueData = {
      roomNumber: room,
      phoneNumber: phoneNumber || '',
      ipAddress: clientIP,
      machineType: 'any'  // Default to 'any' type for general queue
    }
    
    const updatedQueue = await addToQueue(queueData)
    
    res.json({
      success: true,
      message: `${room} đã được thêm vào hàng đợi`,
      position: updatedQueue.length,
      queue: updatedQueue
    })
  } catch (error) {
    console.error('Error joining queue:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/queue/leave - Leave queue
router.post('/leave', async (req, res) => {
  try {
    const clientIP = getClientIP(req)
    
    const currentQueue = await getQueue()
    const userInQueue = currentQueue.find(item => item.ipAddress === clientIP)
    
    if (!userInQueue) {
      return res.status(400).json({ error: 'Not in queue' })
    }
    
    const updatedQueue = await removeFromQueue(clientIP)
    
    res.json({
      success: true,
      message: `${userInQueue.roomNumber} đã rời khỏi hàng đợi`,
      queue: updatedQueue
    })
  } catch (error) {
    console.error('Error leaving queue:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/queue/next - Process next in queue (when machine becomes available)
router.post('/next', async (req, res) => {
  try {
    const nextUser = await getNextInQueue()
    
    if (!nextUser) {
      return res.json({ success: true, message: 'Queue is empty', queue: [] })
    }
    
    // Remove the user from queue
    const updatedQueue = await removeFromQueue(nextUser.ipAddress)
    
    res.json({
      success: true,
      message: `Đã thông báo cho ${nextUser.roomNumber}`,
      nextUser: {
        ip: nextUser.ipAddress,
        room: nextUser.roomNumber,
        phoneNumber: nextUser.phoneNumber,
        joinedAt: nextUser.joinedAt
      },
      queue: updatedQueue
    })
  } catch (error) {
    console.error('Error processing next in queue:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router 
