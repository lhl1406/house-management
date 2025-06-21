const { createClient } = require('@libsql/client')
require('dotenv').config()

// Turso Database Configuration
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Create washing_machines table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS washing_machines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'combined',
        status TEXT NOT NULL DEFAULT 'available',
        is_washing BOOLEAN NOT NULL DEFAULT 0,
        is_drying BOOLEAN NOT NULL DEFAULT 0,
        wash_time INTEGER NOT NULL DEFAULT 0,
        dry_time INTEGER NOT NULL DEFAULT 0,
        current_user_ip TEXT DEFAULT '',
        current_note TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create rooms table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_number TEXT NOT NULL UNIQUE,
        phone_number TEXT DEFAULT '',
        is_using_machine BOOLEAN NOT NULL DEFAULT 0,
        machine_id INTEGER,
        start_time DATETIME,
        estimated_end_time DATETIME,
        notes TEXT DEFAULT '',
        ip_address TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (machine_id) REFERENCES washing_machines(id)
      )
    `)

    // Create washing_history table (cải tiến)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS washing_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id INTEGER NOT NULL,
        room_number TEXT NOT NULL,
        wash_time INTEGER NOT NULL DEFAULT 0,
        dry_time INTEGER NOT NULL DEFAULT 0,
        total_time INTEGER NOT NULL DEFAULT 0,
        note TEXT DEFAULT '',
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (machine_id) REFERENCES washing_machines(id)
      )
    `)

    // Create queue table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_number TEXT NOT NULL,
        phone_number TEXT DEFAULT '',
        ip_address TEXT NOT NULL,
        position INTEGER NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Add type column if it doesn't exist (migration)
    try {
      await client.execute('ALTER TABLE washing_machines ADD COLUMN type TEXT NOT NULL DEFAULT "combined"')
    } catch (error) {
      // Column already exists or other error, continue
    }

    // Insert default washing machines if not exists
    const existingMachines = await client.execute('SELECT COUNT(*) as count FROM washing_machines')
    if (existingMachines.rows[0].count === 0) {
      await client.execute(`
        INSERT INTO washing_machines (name, type, status) VALUES (?, ?, ?)
      `, ['Máy Giặt', 'washing', 'available'])
      
      await client.execute(`
        INSERT INTO washing_machines (name, type, status) VALUES (?, ?, ?)
      `, ['Máy Sấy', 'drying', 'available'])
    } else {
      // Update existing machines to have proper types if they don't
      const machines = await client.execute('SELECT * FROM washing_machines')
      if (machines.rows.length === 1 && machines.rows[0].type === 'combined') {
        // Split the combined machine into separate ones
        await client.execute(`
          UPDATE washing_machines SET name = ?, type = ? WHERE id = ?
        `, ['Máy Giặt', 'washing', machines.rows[0].id])
        
        await client.execute(`
          INSERT INTO washing_machines (name, type, status) VALUES (?, ?, ?)
        `, ['Máy Sấy', 'drying', 'available'])
      }
    }

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

// ============= WASHING MACHINES OPERATIONS =============

const getMachines = async () => {
  try {
    const result = await client.execute('SELECT * FROM washing_machines ORDER BY id')
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type || 'combined',
      status: row.status,
      isWashing: Boolean(row.is_washing),
      isDrying: Boolean(row.is_drying),
      washTime: Number(row.wash_time),
      dryTime: Number(row.dry_time),
      currentUserIP: row.current_user_ip || '',
      currentNote: row.current_note || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  } catch (error) {
    console.error('Error getting machines:', error)
    throw error
  }
}

const getMachineById = async (id) => {
  try {
    const result = await client.execute('SELECT * FROM washing_machines WHERE id = ?', [id])
    if (result.rows.length === 0) return null
    
    const row = result.rows[0]
    return {
      id: row.id,
      name: row.name,
      type: row.type || 'combined',
      status: row.status,
      isWashing: Boolean(row.is_washing),
      isDrying: Boolean(row.is_drying),
      washTime: Number(row.wash_time),
      dryTime: Number(row.dry_time),
      currentUserIP: row.current_user_ip || '',
      currentNote: row.current_note || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  } catch (error) {
    console.error('Error getting machine by id:', error)
    throw error
  }
}

const updateMachine = async (id, updates) => {
  try {
    const fieldsToUpdate = []
    const values = []
    
    if (updates.status !== undefined) {
      fieldsToUpdate.push('status = ?')
      values.push(updates.status)
    }
    if (updates.isWashing !== undefined) {
      fieldsToUpdate.push('is_washing = ?')
      values.push(Boolean(updates.isWashing))
    }
    if (updates.isDrying !== undefined) {
      fieldsToUpdate.push('is_drying = ?')
      values.push(Boolean(updates.isDrying))
    }
    if (updates.washTime !== undefined) {
      fieldsToUpdate.push('wash_time = ?')
      values.push(Number(updates.washTime))
    }
    if (updates.dryTime !== undefined) {
      fieldsToUpdate.push('dry_time = ?')
      values.push(Number(updates.dryTime))
    }
    if (updates.currentUserIP !== undefined) {
      fieldsToUpdate.push('current_user_ip = ?')
      values.push(updates.currentUserIP)
    }
    if (updates.currentNote !== undefined) {
      fieldsToUpdate.push('current_note = ?')
      values.push(updates.currentNote)
    }
    
    fieldsToUpdate.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)
    
    await client.execute(`
      UPDATE washing_machines SET ${fieldsToUpdate.join(', ')} WHERE id = ?
    `, values)
    
    return await getMachineById(id)
  } catch (error) {
    console.error('Error updating machine:', error)
    throw error
  }
}

// ============= ROOMS OPERATIONS =============

const getRooms = async () => {
  try {
    const result = await client.execute(`
      SELECT r.*, m.name as machine_name 
      FROM rooms r 
      LEFT JOIN washing_machines m ON r.machine_id = m.id 
      ORDER BY r.room_number
    `)
    
    return result.rows.map(row => ({
      id: row.id,
      roomNumber: row.room_number,
      phoneNumber: row.phone_number || '',
      isUsingMachine: Boolean(row.is_using_machine),
      machineId: row.machine_id,
      machineName: row.machine_name || '',
      startTime: row.start_time,
      estimatedEndTime: row.estimated_end_time,
      notes: row.notes || '',
      ipAddress: row.ip_address || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  } catch (error) {
    console.error('Error getting rooms:', error)
    throw error
  }
}

const getRoomByNumber = async (roomNumber) => {
  try {
    const result = await client.execute(`
      SELECT r.*, m.name as machine_name 
      FROM rooms r 
      LEFT JOIN washing_machines m ON r.machine_id = m.id 
      WHERE r.room_number = ?
    `, [roomNumber])
    
    if (result.rows.length === 0) return null
    
    const row = result.rows[0]
    return {
      id: row.id,
      roomNumber: row.room_number,
      phoneNumber: row.phone_number || '',
      isUsingMachine: Boolean(row.is_using_machine),
      machineId: row.machine_id,
      machineName: row.machine_name || '',
      startTime: row.start_time,
      estimatedEndTime: row.estimated_end_time,
      notes: row.notes || '',
      ipAddress: row.ip_address || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  } catch (error) {
    console.error('Error getting room by number:', error)
    throw error
  }
}

const createOrUpdateRoom = async (roomData) => {
  try {
    const existing = await getRoomByNumber(roomData.roomNumber)
    
    if (existing) {
      // Update existing room
      const fieldsToUpdate = []
      const values = []
      
      if (roomData.phoneNumber !== undefined) {
        fieldsToUpdate.push('phone_number = ?')
        values.push(roomData.phoneNumber)
      }
      if (roomData.isUsingMachine !== undefined) {
        fieldsToUpdate.push('is_using_machine = ?')
        values.push(Boolean(roomData.isUsingMachine))
      }
      if (roomData.machineId !== undefined) {
        fieldsToUpdate.push('machine_id = ?')
        values.push(roomData.machineId)
      }
      if (roomData.startTime !== undefined) {
        fieldsToUpdate.push('start_time = ?')
        values.push(roomData.startTime)
      }
      if (roomData.estimatedEndTime !== undefined) {
        fieldsToUpdate.push('estimated_end_time = ?')
        values.push(roomData.estimatedEndTime)
      }
      if (roomData.notes !== undefined) {
        fieldsToUpdate.push('notes = ?')
        values.push(roomData.notes)
      }
      if (roomData.ipAddress !== undefined) {
        fieldsToUpdate.push('ip_address = ?')
        values.push(roomData.ipAddress)
      }
      
      fieldsToUpdate.push('updated_at = CURRENT_TIMESTAMP')
      values.push(existing.id)
      
      await client.execute(`
        UPDATE rooms SET ${fieldsToUpdate.join(', ')} WHERE id = ?
      `, values)
      
      return await getRoomByNumber(roomData.roomNumber)
    } else {
      // Create new room
      await client.execute(`
        INSERT INTO rooms (
          room_number, phone_number, is_using_machine, machine_id, 
          start_time, estimated_end_time, notes, ip_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        roomData.roomNumber,
        roomData.phoneNumber || '',
        Boolean(roomData.isUsingMachine || false),
        roomData.machineId || null,
        roomData.startTime || null,
        roomData.estimatedEndTime || null,
        roomData.notes || '',
        roomData.ipAddress || ''
      ])
      
      return await getRoomByNumber(roomData.roomNumber)
    }
  } catch (error) {
    console.error('Error creating/updating room:', error)
    throw error
  }
}

// ============= HISTORY OPERATIONS =============

const getHistory = async (limit = 50) => {
  try {
    const result = await client.execute(`
      SELECT h.*, m.name as machine_name 
      FROM washing_history h 
      LEFT JOIN washing_machines m ON h.machine_id = m.id 
      ORDER BY h.created_at DESC 
      LIMIT ?
    `, [limit])
    
    return result.rows.map(row => ({
      id: row.id,
      machineId: row.machine_id,
      machineName: row.machine_name || '',
      roomNumber: row.room_number,
      washTime: Number(row.wash_time),
      dryTime: Number(row.dry_time),
      totalTime: Number(row.total_time),
      note: row.note || '',
      startTime: row.start_time,
      endTime: row.end_time,
      createdAt: row.created_at
    }))
  } catch (error) {
    console.error('Error getting history:', error)
    throw error
  }
}

const addHistoryRecord = async (record) => {
  try {
    const result = await client.execute(`
      INSERT INTO washing_history (
        machine_id, room_number, wash_time, dry_time, total_time, 
        note, start_time, end_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      record.machineId,
      record.roomNumber,
      Number(record.washTime || 0),
      Number(record.dryTime || 0),
      Number(record.totalTime || 0),
      record.note || '',
      record.startTime,
      record.endTime
    ])

    return await client.execute(`
      SELECT h.*, m.name as machine_name 
      FROM washing_history h 
      LEFT JOIN washing_machines m ON h.machine_id = m.id 
      WHERE h.id = ?
    `, [result.lastInsertRowId])
  } catch (error) {
    console.error('Error adding history record:', error)
    throw error
  }
}

// ============= QUEUE OPERATIONS =============

const getQueue = async () => {
  try {
    const result = await client.execute(
      'SELECT * FROM queue ORDER BY position ASC'
    )
    
    return result.rows.map(row => ({
      id: row.id,
      roomNumber: row.room_number,
      phoneNumber: row.phone_number || '',
      ipAddress: row.ip_address,
      position: row.position,
      joinedAt: row.joined_at,
      createdAt: row.created_at
    }))
  } catch (error) {
    console.error('Error getting queue:', error)
    throw error
  }
}

const addToQueue = async (queueData) => {
  try {
    // Get current max position
    const maxPos = await client.execute('SELECT MAX(position) as max_pos FROM queue')
    const nextPosition = (maxPos.rows[0].max_pos || 0) + 1
    
    await client.execute(`
      INSERT INTO queue (room_number, phone_number, ip_address, position)
      VALUES (?, ?, ?, ?)
    `, [
      queueData.roomNumber,
      queueData.phoneNumber || '',
      queueData.ipAddress,
      nextPosition
    ])
    
    return await getQueue()
  } catch (error) {
    console.error('Error adding to queue:', error)
    throw error
  }
}

const removeFromQueue = async (ipAddress) => {
  try {
    await client.execute('DELETE FROM queue WHERE ip_address = ?', [ipAddress])
    
    // Reorder positions
    const queue = await client.execute('SELECT id FROM queue ORDER BY position ASC')
    for (let i = 0; i < queue.rows.length; i++) {
      await client.execute('UPDATE queue SET position = ? WHERE id = ?', [i + 1, queue.rows[i].id])
    }
    
    return await getQueue()
  } catch (error) {
    console.error('Error removing from queue:', error)
    throw error
  }
}

const getNextInQueue = async () => {
  try {
    const result = await client.execute(
      'SELECT * FROM queue WHERE position = 1 LIMIT 1'
    )
    
    if (result.rows.length === 0) return null
    
    const row = result.rows[0]
    return {
      id: row.id,
      roomNumber: row.room_number,
      phoneNumber: row.phone_number || '',
      ipAddress: row.ip_address,
      position: row.position,
      joinedAt: row.joined_at,
      createdAt: row.created_at
    }
  } catch (error) {
    console.error('Error getting next in queue:', error)
    throw error
  }
}

// ============= BACKWARDS COMPATIBILITY =============
// Giữ lại các function cũ để tương thích với code hiện có

const getMachineState = async () => {
  try {
    const machines = await getMachines()
    const mainMachine = machines[0] || {}
    
    return {
      isWashing: mainMachine.isWashing || false,
      isDrying: mainMachine.isDrying || false,
      washTime: mainMachine.washTime || 0,
      dryTime: mainMachine.dryTime || 0,
      selectedRoom: '',
      currentNote: mainMachine.currentNote || '',
      currentUserIP: mainMachine.currentUserIP || '',
      timestamp: Date.now(),
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error getting machine state:', error)
    throw error
  }
}

const updateMachineState = async (newState) => {
  try {
    const machines = await getMachines()
    const mainMachine = machines[0]
    
    if (!mainMachine) {
      throw new Error('No machine found')
    }
    
    await updateMachine(mainMachine.id, {
      isWashing: newState.isWashing,
      isDrying: newState.isDrying,
      washTime: newState.washTime,
      dryTime: newState.dryTime,
      currentNote: newState.currentNote,
      currentUserIP: newState.currentUserIP,
      status: (newState.isWashing || newState.isDrying) ? 'in_use' : 'available'
    })
    
    return await getMachineState()
  } catch (error) {
    console.error('Error updating machine state:', error)
    throw error
  }
}

module.exports = {
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
} 
