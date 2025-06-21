const express = require('express')
const { 
  getRooms, 
  getRoomByNumber, 
  createOrUpdateRoom,
  getMachines,
  getMachineById,
  updateMachine
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

// GET /api/rooms - Get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await getRooms()
    res.json(rooms)
  } catch (error) {
    console.error('Error getting rooms:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/rooms/:roomNumber - Get specific room
router.get('/:roomNumber', async (req, res) => {
  try {
    const { roomNumber } = req.params
    const room = await getRoomByNumber(roomNumber)
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }
    
    res.json(room)
  } catch (error) {
    console.error('Error getting room:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/rooms - Create or update room
router.post('/', async (req, res) => {
  try {
    const clientIP = getClientIP(req)
    const roomData = {
      ...req.body,
      ipAddress: clientIP
    }
    
    if (!roomData.roomNumber) {
      return res.status(400).json({ error: 'Room number is required' })
    }
    
    const room = await createOrUpdateRoom(roomData)
    res.json({ success: true, room })
  } catch (error) {
    console.error('Error creating/updating room:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/rooms/:roomNumber/start-washing - Start washing for a room
router.post('/:roomNumber/start-washing', async (req, res) => {
  try {
    const { roomNumber } = req.params
    const { machineId, washTime, dryTime, notes } = req.body
    const clientIP = getClientIP(req)
    
    // Get available machines
    const machines = await getMachines()
    const targetMachine = machines.find(m => m.id === machineId) || machines[0]
    
    if (!targetMachine) {
      return res.status(400).json({ error: 'No machines available' })
    }
    
    // Validate time inputs (expect time in seconds now)
    const washTimeSeconds = Number(washTime) || 0
    const dryTimeSeconds = Number(dryTime) || 0
    
    // Check if machine is available based on machine type and requested action
    const isWashingRequested = washTimeSeconds > 0
    const isDryingRequested = dryTimeSeconds > 0
    
    // For washing machine, check if it's not currently washing
    if (targetMachine.type === 'washing' && isWashingRequested && targetMachine.isWashing) {
      return res.status(400).json({ error: 'Máy giặt đang được sử dụng' })
    }
    
    // For drying machine, check if it's not currently drying
    if (targetMachine.type === 'drying' && isDryingRequested && targetMachine.isDrying) {
      return res.status(400).json({ error: 'Máy sấy đang được sử dụng' })
    }
    
    // For combined machine, check if it's completely available
    if (targetMachine.type === 'combined' && targetMachine.status !== 'available') {
      return res.status(400).json({ error: 'Machine is not available' })
    }
    
    if (washTimeSeconds < 0 || dryTimeSeconds < 0) {
      return res.status(400).json({ error: 'Invalid time values' })
    }

    if (washTimeSeconds === 0 && dryTimeSeconds === 0) {
      return res.status(400).json({ error: 'Please set at least one time period' })
    }
    
    const now = new Date()
    // Calculate estimated end time based on seconds
    const totalTimeSeconds = washTimeSeconds + dryTimeSeconds
    const estimatedEndTime = new Date(now.getTime() + totalTimeSeconds * 1000)
    
    // Update room
    const roomData = {
      roomNumber,
      isUsingMachine: true,
      machineId: targetMachine.id,
      startTime: now.toISOString(),
      estimatedEndTime: estimatedEndTime.toISOString(),
      notes: notes || '',
      ipAddress: clientIP
    }
    
    const room = await createOrUpdateRoom(roomData)
    
    // Update machine - store time in seconds
    const machineUpdates = {
      currentUserIP: clientIP,
      currentNote: notes || ''
    }
    
    // For washing machine, only update washing-related fields
    if (targetMachine.type === 'washing') {
      machineUpdates.status = washTimeSeconds > 0 ? 'in_use' : 'available'
      machineUpdates.isWashing = washTimeSeconds > 0
      machineUpdates.washTime = washTimeSeconds
    }
    // For drying machine, only update drying-related fields  
    else if (targetMachine.type === 'drying') {
      machineUpdates.status = dryTimeSeconds > 0 ? 'in_use' : 'available'
      machineUpdates.isDrying = dryTimeSeconds > 0
      machineUpdates.dryTime = dryTimeSeconds
    }
    // For combined machine, update both
    else {
      machineUpdates.status = 'in_use'
      machineUpdates.isWashing = washTimeSeconds > 0
      machineUpdates.isDrying = dryTimeSeconds > 0
      machineUpdates.washTime = washTimeSeconds
      machineUpdates.dryTime = dryTimeSeconds
    }
    
    await updateMachine(targetMachine.id, machineUpdates)
    
    res.json({ 
      success: true, 
      message: `${roomNumber} đã bắt đầu sử dụng máy giặt`,
      room,
      machine: await getMachineById(targetMachine.id),
      timeInfo: {
        washTimeSeconds,
        dryTimeSeconds,
        totalTimeSeconds,
        estimatedEndTime: estimatedEndTime.toISOString()
      }
    })
  } catch (error) {
    console.error('Error starting washing:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/rooms/:roomNumber/finish-washing - Finish washing for a room
router.post('/:roomNumber/finish-washing', async (req, res) => {
  try {
    const { roomNumber } = req.params
    const clientIP = getClientIP(req)
    
    const room = await getRoomByNumber(roomNumber)
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }
    
    if (!room.isUsingMachine) {
      return res.status(400).json({ error: 'Room is not using machine' })
    }
    
    // Check if it's the same user
    if (room.ipAddress !== clientIP) {
      return res.status(403).json({ error: 'Only the user who started can finish' })
    }
    
    // Update room
    const updatedRoom = await createOrUpdateRoom({
      roomNumber,
      isUsingMachine: false,
      machineId: null,
      startTime: null,
      estimatedEndTime: null,
      notes: '',
      ipAddress: ''
    })
    
    // Update machine
    if (room.machineId) {
      const machine = await getMachineById(room.machineId)
      
      if (machine) {
        const machineUpdates = {
          currentUserIP: '',
          currentNote: ''
        }
        
        // For specific machine types, only reset relevant fields
        if (machine.type === 'washing') {
          machineUpdates.status = 'available'
          machineUpdates.isWashing = false
          machineUpdates.washTime = 0
        } else if (machine.type === 'drying') {
          machineUpdates.status = 'available'
          machineUpdates.isDrying = false
          machineUpdates.dryTime = 0
        } else {
          // For combined machine, reset everything
          machineUpdates.status = 'available'
          machineUpdates.isWashing = false
          machineUpdates.isDrying = false
          machineUpdates.washTime = 0
          machineUpdates.dryTime = 0
        }
        
        await updateMachine(room.machineId, machineUpdates)
      }
    }
    
    res.json({ 
      success: true, 
      message: `${roomNumber} đã hoàn thành sử dụng máy giặt`,
      room: updatedRoom
    })
  } catch (error) {
    console.error('Error finishing washing:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router 
