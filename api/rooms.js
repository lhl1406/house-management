const express = require('express')
const router = express.Router()
const { getRoomRepository } = require('./repositories/RepositoryFactory')

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const roomRepo = getRoomRepository()
    const rooms = await roomRepo.findAll()
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
    const roomRepo = getRoomRepository()
    const room = await roomRepo.findByRoomNumber(roomNumber)
    
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
    
    const roomRepo = getRoomRepository()
    const room = await roomRepo.createOrUpdate(roomData)
    res.status(201).json(room)
  } catch (error) {
    console.error('Error creating/updating room:', error)
    res.status(500).json({ error: 'Failed to create/update room' })
  }
})

// Legacy endpoints - redirect to new machine-state API
router.post('/:roomNumber/start-washing', async (req, res) => {
  try {
    // Redirect to machine-state API for compatibility
    res.status(302).json({ 
      message: 'Please use /api/machine-state endpoint',
      redirect: '/api/machine-state'
    })
  } catch (error) {
    console.error('Error starting machine usage:', error)
    res.status(500).json({ error: 'Failed to start machine usage' })
  }
})

// Legacy endpoints - redirect to new machine-state API
router.post('/:roomNumber/finish-washing', async (req, res) => {
  try {
    // Redirect to machine-state API for compatibility
    res.status(302).json({ 
      message: 'Please use /api/machine-state endpoint',
      redirect: '/api/machine-state'
    })
  } catch (error) {
    console.error('Error finishing machine usage:', error)
    res.status(500).json({ error: 'Failed to finish machine usage' })
  }
})

// Legacy endpoints - redirect to new machine-state API
router.put('/:roomNumber/update-notes', async (req, res) => {
  try {
    // Redirect to machine-state API for compatibility
    res.status(302).json({ 
      message: 'Please use /api/machine-state endpoint',
      redirect: '/api/machine-state'
    })
  } catch (error) {
    console.error('Error updating machine usage notes:', error)
    res.status(500).json({ error: 'Failed to update notes' })
  }
})

module.exports = router 
