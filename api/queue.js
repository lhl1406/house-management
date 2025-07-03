const express = require('express')
const { getQueueService } = require('./services/QueueService')

const router = express.Router()
const queueService = getQueueService()

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
    const { machineType } = req.query
    const queue = await queueService.getQueue(machineType)
    const isInQueue = await queueService.isInQueue(clientIP)
    
    res.json({
      queue,
      clientIP,
      isInQueue
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
    const { room, phoneNumber, machineType } = req.body
    
    if (!room) {
      return res.status(400).json({ error: 'Room is required' })
    }
    
    const result = await queueService.joinQueue(
      room,
      phoneNumber || '',
      clientIP,
      machineType || 'any'
    )
    
    const updatedQueue = await queueService.getQueue()
    
    res.json({
      ...result,
      position: result.queueItem.position,
      queue: updatedQueue
    })
  } catch (error) {
    console.error('Error joining queue:', error)
    if (error.message === 'IP already in queue') {
      res.status(400).json({ error: 'IP already in queue' })
    } else {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
})

// POST /api/queue/leave - Leave queue
router.post('/leave', async (req, res) => {
  try {
    const clientIP = getClientIP(req)
    const { room } = req.body  // Optional room parameter for additional verification
    
    console.log(`🚪 Leave queue request from IP: ${clientIP}, Room: ${room || 'not specified'}`)
    
    const result = await queueService.leaveQueue(clientIP, room)
    
    res.json(result)
  } catch (error) {
    console.error('Error leaving queue:', error)
    if (error.message === 'IP not found in queue') {
      res.status(400).json({ error: 'Bạn không có trong hàng đợi' })
    } else if (error.message === 'Room number does not match queue record') {
      res.status(400).json({ error: 'Phòng không khớp với thông tin trong hàng đợi' })
    } else {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
})

// POST /api/queue/next - Process next in queue (when machine becomes available)
router.post('/next', async (req, res) => {
  try {
    const { machineType } = req.body
    const result = await queueService.processNextInQueue(machineType)
    
    res.json(result)
  } catch (error) {
    console.error('Error processing next in queue:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router 
