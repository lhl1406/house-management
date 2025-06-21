const express = require('express')
const { 
  getMachines, 
  getMachineById, 
  updateMachine 
} = require('./data')

const router = express.Router()

// GET /api/machines - Get all machines
router.get('/', async (req, res) => {
  try {
    const machines = await getMachines()
    res.json(machines)
  } catch (error) {
    console.error('Error getting machines:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/machines/:id - Get specific machine
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const machine = await getMachineById(parseInt(id))
    
    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' })
    }
    
    res.json(machine)
  } catch (error) {
    console.error('Error getting machine:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/machines/:id - Update machine
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    
    const machine = await updateMachine(parseInt(id), updates)
    
    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' })
    }
    
    res.json({ success: true, machine })
  } catch (error) {
    console.error('Error updating machine:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/machines/status/available - Get available machines
router.get('/status/available', async (req, res) => {
  try {
    const machines = await getMachines()
    const availableMachines = machines.filter(m => m.status === 'available')
    res.json(availableMachines)
  } catch (error) {
    console.error('Error getting available machines:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router 
