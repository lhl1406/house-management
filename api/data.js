// Database integration with fallback support
// Production-ready database integration

const {
  initializeDatabase,
  
  // Machines
  getMachines,
  getMachineById,
  getMachinesByType,
  getAvailableMachines,
  updateMachine,
  
  // Rooms
  getRooms,
  getRoomByNumber,
  getRoomByIP,
  createOrUpdateRoom,
  
  // Room Machine Usage
  getRoomMachineUsage,
  startMachineUsage,
  finishMachineUsage,
  updateMachineUsageNotes,
  
  // History
  getHistory,
  addHistoryRecord,
  
  // Queue
  getQueue,
  addToQueue,
  removeFromQueue,
  getNextInQueue,
  
  // Statistics
  getStatistics
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
      throw error
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
    throw error
  }
}

const getMachineByIdWithFallback = async (id) => {
  try {
    await initDB()
    return await getMachineById(id)
  } catch (error) {
    console.error('Database error getting machine by id:', error)
    throw error
  }
}

const getMachinesByTypeWithFallback = async (type) => {
  try {
    await initDB()
    return await getMachinesByType(type)
  } catch (error) {
    console.error('Database error getting machines by type:', error)
    throw error
  }
}

const getAvailableMachinesWithFallback = async (type = null) => {
  try {
    await initDB()
    return await getAvailableMachines(type)
  } catch (error) {
    console.error('Database error getting available machines:', error)
    throw error
  }
}

const updateMachineWithFallback = async (id, updates) => {
  try {
    await initDB()
    return await updateMachine(id, updates)
  } catch (error) {
    console.error('Database error updating machine:', error)
    throw error
  }
}

// ============= ROOMS API =============

const getRoomsWithFallback = async () => {
  try {
    await initDB()
    return await getRooms()
  } catch (error) {
    console.error('Database error getting rooms:', error)
    throw error
  }
}

const getRoomByNumberWithFallback = async (roomNumber) => {
  try {
    await initDB()
    return await getRoomByNumber(roomNumber)
  } catch (error) {
    console.error('Database error getting room by number:', error)
    throw error
  }
}

const getRoomByIPWithFallback = async (ipAddress) => {
  try {
    await initDB()
    return await getRoomByIP(ipAddress)
  } catch (error) {
    console.error('Database error getting room by IP:', error)
    throw error
  }
}

const createOrUpdateRoomWithFallback = async (roomData) => {
  try {
    await initDB()
    return await createOrUpdateRoom(roomData)
  } catch (error) {
    console.error('Database error creating/updating room:', error)
    throw error
  }
}

// ============= ROOM MACHINE USAGE API =============

const getRoomMachineUsageWithFallback = async (roomNumber = null, isActive = true) => {
  try {
    await initDB()
    return await getRoomMachineUsage(roomNumber, isActive)
  } catch (error) {
    console.error('Database error getting room machine usage:', error)
    throw error
  }
}

const startMachineUsageWithFallback = async (usageData) => {
  try {
    await initDB()
    return await startMachineUsage(usageData)
  } catch (error) {
    console.error('Database error starting machine usage:', error)
    throw error
  }
}

const finishMachineUsageWithFallback = async (machineId, roomNumber) => {
  try {
    await initDB()
    return await finishMachineUsage(machineId, roomNumber)
  } catch (error) {
    console.error('Database error finishing machine usage:', error)
    throw error
  }
}

const updateMachineUsageNotesWithFallback = async (machineId, roomNumber, notes) => {
  try {
    await initDB()
    return await updateMachineUsageNotes(machineId, roomNumber, notes)
  } catch (error) {
    console.error('Database error updating machine usage notes:', error)
    throw error
  }
}

// ============= QUEUE API =============

const getQueueWithFallback = async (machineType = null) => {
  try {
    await initDB()
    return await getQueue(machineType)
  } catch (error) {
    console.error('Database error getting queue:', error)
    throw error
  }
}

const addToQueueWithFallback = async (queueData) => {
  try {
    await initDB()
    return await addToQueue(queueData)
  } catch (error) {
    console.error('Database error adding to queue:', error)
    throw error
  }
}

const removeFromQueueWithFallback = async (ipAddress, machineType = null) => {
  try {
    await initDB()
    return await removeFromQueue(ipAddress, machineType)
  } catch (error) {
    console.error('Database error removing from queue:', error)
    throw error
  }
}

const getNextInQueueWithFallback = async (machineType = null) => {
  try {
    await initDB()
    return await getNextInQueue(machineType)
  } catch (error) {
    console.error('Database error getting next in queue:', error)
    throw error
  }
}

// ============= HISTORY API =============

const getHistoryWithFallback = async (limit = 50) => {
  try {
    await initDB()
    return await getHistory(limit)
  } catch (error) {
    console.error('Database error getting history:', error)
    throw error
  }
}

const addHistoryRecordWithFallback = async (record) => {
  try {
    await initDB()
    return await addHistoryRecord(record)
  } catch (error) {
    console.error('Database error adding history record:', error)
    throw error
  }
}

// ============= STATISTICS API =============

const getStatisticsWithFallback = async () => {
  try {
    await initDB()
    return await getStatistics()
  } catch (error) {
    console.error('Database error getting statistics:', error)
    throw error
  }
}

// ============= EXPORTS =============

module.exports = {
  // Database initialization
  initializeDatabase: initDB,
  
  // Machines
  getMachines: getMachinesWithFallback,
  getMachineById: getMachineByIdWithFallback,
  getMachinesByType: getMachinesByTypeWithFallback,
  getAvailableMachines: getAvailableMachinesWithFallback,
  updateMachine: updateMachineWithFallback,
  
  // Rooms
  getRooms: getRoomsWithFallback,
  getRoomByNumber: getRoomByNumberWithFallback,
  getRoomByIP: getRoomByIPWithFallback,
  createOrUpdateRoom: createOrUpdateRoomWithFallback,
  
  // Room Machine Usage
  getRoomMachineUsage: getRoomMachineUsageWithFallback,
  startMachineUsage: startMachineUsageWithFallback,
  finishMachineUsage: finishMachineUsageWithFallback,
  updateMachineUsageNotes: updateMachineUsageNotesWithFallback,
  
  // History
  getHistory: getHistoryWithFallback,
  addHistoryRecord: addHistoryRecordWithFallback,
  
  // Queue
  getQueue: getQueueWithFallback,
  addToQueue: addToQueueWithFallback,
  removeFromQueue: removeFromQueueWithFallback,
  getNextInQueue: getNextInQueueWithFallback,
  
  // Statistics
  getStatistics: getStatisticsWithFallback
} 
