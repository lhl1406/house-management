const express = require('express')
const { getMachineState, updateMachineState } = require('./data')

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

// GET /api/machine-state
router.get('/', async (req, res) => {
  try {
    const clientIP = getClientIP(req)
    const state = await getMachineState()
    
    // Add client IP info to response
    res.status(200).json({
      ...state,
      clientIP,
      currentUserIP: state.currentUserIP,
      machineUserIP: state.currentUserIP,
      canUse: !state.currentUserIP || state.currentUserIP === clientIP
    })
  } catch (error) {
    console.error('Error getting machine state:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/machine-state
router.post('/', async (req, res) => {
  try {
    const clientIP = getClientIP(req)
    const newState = req.body
    
    // Add IP tracking to state
    if (newState.isWashing || newState.isDrying) {
      newState.currentUserIP = clientIP
    } else if (!newState.isWashing && !newState.isDrying) {
      // Reset IP when not in use - use empty string instead of null
      newState.currentUserIP = ''
    }
    
    const updatedState = await updateMachineState(newState)
    res.status(200).json({ 
      success: true, 
      state: {
        ...updatedState,
        clientIP,
        currentUserIP: updatedState.currentUserIP,
        machineUserIP: updatedState.currentUserIP,
        canUse: !updatedState.currentUserIP || updatedState.currentUserIP === clientIP
      }
    })
  } catch (error) {
    console.error('Error updating machine state:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router 
