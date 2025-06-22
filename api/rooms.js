const express = require('express')
const router = express.Router()
const { 
  getRooms, 
  getRoomByNumber, 
  getRoomByIP, 
  createOrUpdateRoom,
  startMachineUsage,
  finishMachineUsage,
  updateMachineUsageNotes 
} = require('./db')

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await getRooms()
    res.json(rooms)
  } catch (error) {
    console.error('Error getting rooms:', error)
    res.status(500).json({ error: 'Failed to get rooms' })
  }
})

// Get room by number
router.get('/:roomNumber', async (req, res) => {
  try {
    const roomNumber = req.params.roomNumber
    const room = await getRoomByNumber(roomNumber)
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }
    
    res.json(room)
  } catch (error) {
    console.error('Error getting room by number:', error)
    res.status(500).json({ error: 'Failed to get room' })
  }
})

// Create or update room
router.post('/', async (req, res) => {
  try {
    const roomData = req.body
    
    if (!roomData.roomNumber || !roomData.ipAddress) {
      return res.status(400).json({ 
        error: 'Room number and IP address are required' 
      })
    }
    
    const room = await createOrUpdateRoom(roomData)
    res.status(201).json(room)
  } catch (error) {
    console.error('Error creating/updating room:', error)
    res.status(500).json({ error: 'Failed to create/update room' })
  }
})

// Start washing machine in room
router.post('/:roomNumber/start-washing', async (req, res) => {
  try {
    const roomNumber = req.params.roomNumber
    const { machineId, estimatedEndTime, notes, phoneNumber } = req.body
    const ipAddress = req.ip || req.connection.remoteAddress
    
    if (!machineId || !estimatedEndTime) {
      return res.status(400).json({ 
        error: 'Machine ID and estimated end time are required' 
      })
    }
    
    const usageId = await startMachineUsage({
      roomNumber,
      machineId,
      ipAddress,
      estimatedEndTime,
      notes,
      phoneNumber
    })
    
    res.status(201).json({ 
      success: true, 
      usageId,
      message: 'Machine usage started successfully' 
    })
  } catch (error) {
    console.error('Error starting machine usage:', error)
    res.status(500).json({ error: 'Failed to start machine usage' })
  }
})

// Finish washing machine in room
router.post('/:roomNumber/finish-washing', async (req, res) => {
  try {
    const roomNumber = req.params.roomNumber
    const { machineId } = req.body
    
    if (!machineId) {
      return res.status(400).json({ 
        error: 'Machine ID is required' 
      })
    }
    
    await finishMachineUsage(machineId, roomNumber)
    
    res.json({ 
      success: true, 
      message: 'Machine usage finished successfully' 
    })
  } catch (error) {
    console.error('Error finishing machine usage:', error)
    res.status(500).json({ error: 'Failed to finish machine usage' })
  }
})

// Update machine usage notes
router.put('/:roomNumber/update-notes', async (req, res) => {
  try {
    const roomNumber = req.params.roomNumber
    const { machineId, notes } = req.body
    
    if (!machineId) {
      return res.status(400).json({ 
        error: 'Machine ID is required' 
      })
    }
    
    const success = await updateMachineUsageNotes(machineId, roomNumber, notes)
    
    if (!success) {
      return res.status(404).json({
        error: 'Active machine usage not found for this room'
      })
    }
    
    res.json({ 
      success: true, 
      message: 'Notes updated successfully' 
    })
  } catch (error) {
    console.error('Error updating machine usage notes:', error)
    res.status(500).json({ error: 'Failed to update notes' })
  }
})

module.exports = router 
