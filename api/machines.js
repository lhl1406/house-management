const express = require('express')
const { getMachineService } = require('./services/MachineService')

const router = express.Router()
const machineService = getMachineService()

// GET /api/machines - Get all machines
router.get('/', async (req, res) => {
  try {
    const machines = await machineService.getAllMachines()
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
    const machine = await machineService.getMachineById(parseInt(id))
    
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
    
    // For now, we'll use the repository directly through the service
    // In the future, add specific business logic methods to the service
    const machine = await machineService.machineRepo.update(parseInt(id), updates)
    
    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' })
    }
    
    const domainMachine = machineService.machineRepo.toDomainObject(machine)
    res.json({ success: true, machine: domainMachine })
  } catch (error) {
    console.error('Error updating machine:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/machines/status/available - Get available machines
router.get('/status/available', async (req, res) => {
  try {
    const { type } = req.query
    const availableMachines = await machineService.getAvailableMachines(type)
    res.json(availableMachines)
  } catch (error) {
    console.error('Error getting available machines:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router 
