// In-memory data store (will reset on server restart)
// For production, you might want to use a real database

const {
  initializeDatabase,
  
  // Machines
  getMachines,
  getMachineById,
  updateMachine,
  
  // Rooms
  getRooms,
  getRoomByNumber,
  createOrUpdateRoom,
  
  // History
  getHistory,
  addHistoryRecord,
  
  // Queue
  getQueue,
  addToQueue,
  removeFromQueue,
  getNextInQueue,
  
  // Backwards compatibility
  getMachineState,
  updateMachineState
} = require('./db')

// Initialize database on module load
let dbInitialized = false

const initDB = async () => {
  if (!dbInitialized) {
    try {
      await initializeDatabase()
      dbInitialized = true
      console.log('Database connection established')
    } catch (error) {
      console.error('Failed to initialize database:', error)
      // Fallback to in-memory storage if database fails
      console.log('Falling back to in-memory storage')
    }
  }
}

// Initialize on startup
initDB()

// ============= MACHINES API =============

const getMachinesWithFallback = async () => {
  try {
    await initDB()
    return await getMachines()
  } catch (error) {
    console.error('Database error getting machines:', error)
    return [{
      id: 1,
      name: 'Máy giặt chính',
      status: 'available',
      isWashing: false,
      isDrying: false,
      washTime: 0,
      dryTime: 0,
      currentUserIP: '',
      currentNote: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }]
  }
}

const getMachineByIdWithFallback = async (id) => {
  try {
    await initDB()
    return await getMachineById(id)
  } catch (error) {
    console.error('Database error getting machine by id:', error)
    return null
  }
}

const updateMachineWithFallback = async (id, updates) => {
  try {
    await initDB()
    return await updateMachine(id, updates)
  } catch (error) {
    console.error('Database error updating machine:', error)
    return null
  }
}

// ============= ROOMS API =============

const getRoomsWithFallback = async () => {
  try {
    await initDB()
    return await getRooms()
  } catch (error) {
    console.error('Database error getting rooms:', error)
    return []
  }
}

const getRoomByNumberWithFallback = async (roomNumber) => {
  try {
    await initDB()
    return await getRoomByNumber(roomNumber)
  } catch (error) {
    console.error('Database error getting room by number:', error)
    return null
  }
}

const createOrUpdateRoomWithFallback = async (roomData) => {
  try {
    await initDB()
    return await createOrUpdateRoom(roomData)
  } catch (error) {
    console.error('Database error creating/updating room:', error)
    return {
      id: Date.now(),
      roomNumber: roomData.roomNumber,
      phoneNumber: roomData.phoneNumber || '',
      isUsingMachine: roomData.isUsingMachine || false,
      machineId: roomData.machineId || null,
      machineName: '',
      startTime: roomData.startTime || null,
      estimatedEndTime: roomData.estimatedEndTime || null,
      notes: roomData.notes || '',
      ipAddress: roomData.ipAddress || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
}

// ============= QUEUE API =============

const getQueueWithFallback = async () => {
  try {
    await initDB()
    return await getQueue()
  } catch (error) {
    console.error('Database error getting queue:', error)
    return []
  }
}

const addToQueueWithFallback = async (queueData) => {
  try {
    await initDB()
    return await addToQueue(queueData)
  } catch (error) {
    console.error('Database error adding to queue:', error)
    return []
  }
}

const removeFromQueueWithFallback = async (ipAddress) => {
  try {
    await initDB()
    return await removeFromQueue(ipAddress)
  } catch (error) {
    console.error('Database error removing from queue:', error)
    return []
  }
}

const getNextInQueueWithFallback = async () => {
  try {
    await initDB()
    return await getNextInQueue()
  } catch (error) {
    console.error('Database error getting next in queue:', error)
    return null
  }
}

// ============= BACKWARDS COMPATIBILITY =============

const getMachineStateWithFallback = async () => {
  try {
    await initDB()
    return await getMachineState()
  } catch (error) {
    console.error('Database error, using fallback:', error)
    // Fallback data
    return {
      isWashing: false,
      isDrying: false,
      washTime: 0,
      dryTime: 0,
      selectedRoom: '',
      currentNote: '',
      currentUserIP: '',
      timestamp: Date.now(),
      lastUpdated: new Date().toISOString()
    }
  }
}

const updateMachineStateWithFallback = async (newState) => {
  try {
    await initDB()
    return await updateMachineState(newState)
  } catch (error) {
    console.error('Database error updating state:', error)
    return newState
  }
}

const getHistoryWithFallback = async (limit = 50) => {
  try {
    await initDB()
    return await getHistory(limit)
  } catch (error) {
    console.error('Database error getting history:', error)
    return []
  }
}

const addHistoryRecordWithFallback = async (record) => {
  try {
    await initDB()
    return await addHistoryRecord(record)
  } catch (error) {
    console.error('Database error adding history:', error)
    return {
      id: Date.now(),
      machineId: record.machineId || 1,
      machineName: 'Máy giặt chính',
      roomNumber: record.roomNumber || '',
      washTime: record.washTime || 0,
      dryTime: record.dryTime || 0,
      totalTime: record.totalTime || 0,
      note: record.note || '',
      startTime: record.startTime || new Date().toISOString(),
      endTime: record.endTime || new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
  }
}

module.exports = {
  // New APIs
  getMachines: getMachinesWithFallback,
  getMachineById: getMachineByIdWithFallback,
  updateMachine: updateMachineWithFallback,
  
  getRooms: getRoomsWithFallback,
  getRoomByNumber: getRoomByNumberWithFallback,
  createOrUpdateRoom: createOrUpdateRoomWithFallback,
  
  getQueue: getQueueWithFallback,
  addToQueue: addToQueueWithFallback,
  removeFromQueue: removeFromQueueWithFallback,
  getNextInQueue: getNextInQueueWithFallback,
  
  // Backwards compatibility
  getMachineState: getMachineStateWithFallback,
  updateMachineState: updateMachineStateWithFallback,
  getHistory: getHistoryWithFallback,
  addHistoryRecord: addHistoryRecordWithFallback
} 
