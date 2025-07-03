const express = require('express')
const { getMachineService } = require('./services/MachineService')

const router = express.Router()
const machineService = getMachineService()

// GET /api/history
router.get('/', async (req, res) => {
  try {
    const { limit, roomNumber } = req.query
    
    let history
    if (roomNumber) {
      history = await machineService.getMachineHistoryByRoom(roomNumber, parseInt(limit) || 20)
    } else {
      history = await machineService.getMachineHistory(parseInt(limit) || 50)
    }
    
    res.status(200).json(history)
  } catch (error) {
    console.error('Error getting history:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/history/statistics
router.get('/statistics', async (req, res) => {
  try {
    const stats = await machineService.getMachineStatistics()
    res.status(200).json(stats)
  } catch (error) {
    console.error('Error getting statistics:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/history
router.post('/', async (req, res) => {
  try {
    const record = req.body
    const newRecord = await machineService.historyRepo.addRecord(record)
    res.status(200).json({ success: true, record: newRecord })
  } catch (error) {
    console.error('Error adding history record:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router 
