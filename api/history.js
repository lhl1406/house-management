const express = require('express')
const { getHistory, addHistoryRecord } = require('./data')

const router = express.Router()

// GET /api/history
router.get('/', async (req, res) => {
  try {
    const history = await getHistory()
    res.status(200).json(history)
  } catch (error) {
    console.error('Error getting history:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/history
router.post('/', async (req, res) => {
  try {
    const record = req.body
    const newRecord = await addHistoryRecord(record)
    res.status(200).json({ success: true, record: newRecord })
  } catch (error) {
    console.error('Error adding history record:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router 
