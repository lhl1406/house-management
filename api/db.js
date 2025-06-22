const { createClient } = require('@libsql/client')
require('dotenv').config()

// Helper function to convert BigInt to Number for JSON serialization
const convertBigIntToNumber = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToNumber(value);
    }
    return converted;
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  }
  return obj;
};

// Turso Database Configuration
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

// Log database connection info
console.log('🗄️  Database Configuration:')
console.log(`   URL: ${process.env.TURSO_DATABASE_URL ? 'Turso Remote DB' : 'Local SQLite fallback'}`)
if (process.env.TURSO_DATABASE_URL && !process.env.TURSO_DATABASE_URL.includes('file:')) {
  console.log(`   Auth Token: ${process.env.TURSO_AUTH_TOKEN ? '✅ Configured' : '❌ Missing'}`)
}

console.log('🔄 Initializing database connection...')

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Create washing_machines table - Máy giặt và máy sấy riêng biệt
    await client.execute(`
      CREATE TABLE IF NOT EXISTS washing_machines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('washing', 'drying')),
        status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'in_use', 'maintenance')),
        current_room_number TEXT DEFAULT '',
        current_user_ip TEXT DEFAULT '',
        current_note TEXT DEFAULT '',
        start_time DATETIME,
        estimated_end_time DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create rooms table - Lưu thông tin phòng và IP
    await client.execute(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_number TEXT NOT NULL UNIQUE,
        phone_number TEXT DEFAULT '',
        ip_address TEXT NOT NULL UNIQUE,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create room_machine_usage table - Theo dõi phòng đang sử dụng máy nào
    await client.execute(`
      CREATE TABLE IF NOT EXISTS room_machine_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_number TEXT NOT NULL,
        machine_id INTEGER NOT NULL,
        ip_address TEXT NOT NULL,
        phone_number TEXT DEFAULT '',
        start_time DATETIME NOT NULL,
        estimated_end_time DATETIME NOT NULL,
        actual_end_time DATETIME,
        notes TEXT DEFAULT '',
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (machine_id) REFERENCES washing_machines(id),
        FOREIGN KEY (room_number) REFERENCES rooms(room_number)
      )
    `)

    // Create washing_history table - Lịch sử sử dụng chi tiết
    await client.execute(`
      CREATE TABLE IF NOT EXISTS washing_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id INTEGER NOT NULL,
        machine_type TEXT NOT NULL,
        machine_name TEXT NOT NULL,
        room_number TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 0,
        notes TEXT DEFAULT '',
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (machine_id) REFERENCES washing_machines(id)
      )
    `)

    // Create queue table - Hàng đợi cho từng loại máy
    await client.execute(`
      CREATE TABLE IF NOT EXISTS queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_number TEXT NOT NULL,
        phone_number TEXT DEFAULT '',
        ip_address TEXT NOT NULL,
        machine_type TEXT NOT NULL CHECK(machine_type IN ('washing', 'drying', 'any')),
        position INTEGER NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Insert default washing machines if not exists
    const existingMachines = await client.execute('SELECT COUNT(*) as count FROM washing_machines')
    if (existingMachines.rows[0].count === 0) {
      // Tạo máy giặt
      await client.execute(`
        INSERT INTO washing_machines (name, type, status) VALUES (?, ?, ?)
      `, ['Máy Giặt 1', 'washing', 'available'])
      
      await client.execute(`
        INSERT INTO washing_machines (name, type, status) VALUES (?, ?, ?)
      `, ['Máy Giặt 2', 'washing', 'available'])
      
      // Tạo máy sấy
      await client.execute(`
        INSERT INTO washing_machines (name, type, status) VALUES (?, ?, ?)
      `, ['Máy Sấy 1', 'drying', 'available'])
      
      await client.execute(`
        INSERT INTO washing_machines (name, type, status) VALUES (?, ?, ?)
      `, ['Máy Sấy 2', 'drying', 'available'])
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
    const result = await client.execute('SELECT * FROM washing_machines ORDER BY type, id')
    return result.rows.map(row => convertBigIntToNumber({
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      currentRoomNumber: row.current_room_number || '',
      currentUserIP: row.current_user_ip || '',
      currentNote: row.current_note || '',
      startTime: row.start_time,
      estimatedEndTime: row.estimated_end_time,
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
      type: row.type,
      status: row.status,
      currentRoomNumber: row.current_room_number || '',
      currentUserIP: row.current_user_ip || '',
      currentNote: row.current_note || '',
      startTime: row.start_time,
      estimatedEndTime: row.estimated_end_time,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  } catch (error) {
    console.error('Error getting machine by id:', error)
    throw error
  }
}

const getMachinesByType = async (type) => {
  try {
    const result = await client.execute('SELECT * FROM washing_machines WHERE type = ? ORDER BY id', [type])
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      currentRoomNumber: row.current_room_number || '',
      currentUserIP: row.current_user_ip || '',
      currentNote: row.current_note || '',
      startTime: row.start_time,
      estimatedEndTime: row.estimated_end_time,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  } catch (error) {
    console.error('Error getting machines by type:', error)
    throw error
  }
}

const getAvailableMachines = async (type = null) => {
  try {
    let query = 'SELECT * FROM washing_machines WHERE status = "available"'
    let params = []
    
    if (type) {
      query += ' AND type = ?'
      params.push(type)
    }
    
    query += ' ORDER BY type, id'
    
    const result = await client.execute(query, params)
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      currentRoomNumber: row.current_room_number || '',
      currentUserIP: row.current_user_ip || '',
      currentNote: row.current_note || '',
      startTime: row.start_time,
      estimatedEndTime: row.estimated_end_time,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  } catch (error) {
    console.error('Error getting available machines:', error)
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
    if (updates.currentRoomNumber !== undefined) {
      fieldsToUpdate.push('current_room_number = ?')
      values.push(updates.currentRoomNumber)
    }
    if (updates.currentUserIP !== undefined) {
      fieldsToUpdate.push('current_user_ip = ?')
      values.push(updates.currentUserIP)
    }
    if (updates.currentNote !== undefined) {
      fieldsToUpdate.push('current_note = ?')
      values.push(updates.currentNote)
    }
    if (updates.startTime !== undefined) {
      fieldsToUpdate.push('start_time = ?')
      values.push(updates.startTime)
    }
    if (updates.estimatedEndTime !== undefined) {
      fieldsToUpdate.push('estimated_end_time = ?')
      values.push(updates.estimatedEndTime)
    }
    
    fieldsToUpdate.push('updated_at = CURRENT_TIMESTAMP')
    
    if (fieldsToUpdate.length === 1) {
      return await getMachineById(id)
    }
    
    values.push(id)
    
    await client.execute(
      `UPDATE washing_machines SET ${fieldsToUpdate.join(', ')} WHERE id = ?`,
      values
    )
    
    return await getMachineById(id)
  } catch (error) {
    console.error('Error updating machine:', error)
    throw error
  }
}

// ============= ROOMS OPERATIONS =============

const getRooms = async () => {
  try {
    const result = await client.execute('SELECT * FROM rooms ORDER BY room_number')
    return result.rows.map(row => ({
      id: row.id,
      roomNumber: row.room_number,
      phoneNumber: row.phone_number || '',
      ipAddress: row.ip_address,
      isActive: Boolean(row.is_active),
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
    const result = await client.execute('SELECT * FROM rooms WHERE room_number = ?', [roomNumber])
    if (result.rows.length === 0) return null
    
    const row = result.rows[0]
    return {
      id: row.id,
      roomNumber: row.room_number,
      phoneNumber: row.phone_number || '',
      ipAddress: row.ip_address,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  } catch (error) {
    console.error('Error getting room by number:', error)
    throw error
  }
}

const getRoomByIP = async (ipAddress) => {
  try {
    const result = await client.execute('SELECT * FROM rooms WHERE ip_address = ?', [ipAddress])
    if (result.rows.length === 0) return null
    
    const row = result.rows[0]
    return {
      id: row.id,
      roomNumber: row.room_number,
      phoneNumber: row.phone_number || '',
      ipAddress: row.ip_address,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  } catch (error) {
    console.error('Error getting room by IP:', error)
    throw error
  }
}

const createOrUpdateRoom = async (roomData) => {
  try {
    const { roomNumber, phoneNumber, ipAddress } = roomData
    
    // Check if room exists
    const existingRoom = await getRoomByNumber(roomNumber)
    
    if (existingRoom) {
      // Update existing room
      await client.execute(
        'UPDATE rooms SET phone_number = ?, ip_address = ?, updated_at = CURRENT_TIMESTAMP WHERE room_number = ?',
        [phoneNumber || '', ipAddress, roomNumber]
      )
    } else {
      // Create new room
      await client.execute(
        'INSERT INTO rooms (room_number, phone_number, ip_address) VALUES (?, ?, ?)',
        [roomNumber, phoneNumber || '', ipAddress]
      )
    }
    
    return await getRoomByNumber(roomNumber)
  } catch (error) {
    console.error('Error creating/updating room:', error)
    throw error
  }
}

// ============= ROOM MACHINE USAGE OPERATIONS =============

const getRoomMachineUsage = async (roomNumber = null, isActive = true) => {
  try {
    let query = `
      SELECT rmu.*, wm.name as machine_name, wm.type as machine_type
      FROM room_machine_usage rmu
      JOIN washing_machines wm ON rmu.machine_id = wm.id
    `
    let params = []
    
    const conditions = []
    if (roomNumber) {
      conditions.push('rmu.room_number = ?')
      params.push(roomNumber)
    }
    if (isActive !== null) {
      conditions.push('rmu.is_active = ?')
      params.push(isActive ? 1 : 0)
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    query += ' ORDER BY rmu.start_time DESC'
    
    const result = await client.execute(query, params)
    return result.rows.map(row => convertBigIntToNumber({
      id: row.id,
      roomNumber: row.room_number,
      machineId: row.machine_id,
      machineName: row.machine_name,
      machineType: row.machine_type,
      ipAddress: row.ip_address,
      phoneNumber: row.phone_number || '',
      startTime: row.start_time,
      estimatedEndTime: row.estimated_end_time,
      actualEndTime: row.actual_end_time,
      notes: row.notes || '',
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  } catch (error) {
    console.error('Error getting room machine usage:', error)
    throw error
  }
}

const startMachineUsage = async (usageData) => {
  try {
    const { roomNumber, machineId, ipAddress, estimatedEndTime, notes, phoneNumber } = usageData
    const startTime = new Date().toISOString()
    
    // Ensure room exists first to avoid FK constraint error
    try {
      await createOrUpdateRoom({
        roomNumber,
        ipAddress,
        phoneNumber: phoneNumber || ''
      })
    } catch (roomError) {
      console.log('Room creation skipped (may already exist):', roomError.message)
    }
    
    const result = await client.execute(
      `INSERT INTO room_machine_usage 
       (room_number, machine_id, ip_address, phone_number, start_time, estimated_end_time, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [roomNumber, machineId, ipAddress, phoneNumber || '', startTime, estimatedEndTime, notes || '']
    )
    
    console.log('Insert result structure:', result)
    
    // Handle different database response structures
    let insertId;
    if (result.meta && result.meta.last_insert_rowid) {
      insertId = result.meta.last_insert_rowid;
    } else if (result.lastInsertRowid) {
      insertId = result.lastInsertRowid;
    } else if (result.insertId) {
      insertId = result.insertId;
    } else {
      // Fallback: use current timestamp as ID
      insertId = Date.now();
      console.log('Warning: Could not get insert ID, using timestamp fallback:', insertId);
    }
    
    // Convert BigInt to Number for JSON serialization
    if (typeof insertId === 'bigint') {
      insertId = Number(insertId);
    }
    
    // Update machine status
    await updateMachine(machineId, {
      status: 'in_use',
      currentRoomNumber: roomNumber,
      currentUserIP: ipAddress,
      currentNote: notes || '',
      startTime: startTime,
      estimatedEndTime: estimatedEndTime
    })
    
    return insertId
  } catch (error) {
    console.error('Error starting machine usage:', error)
    throw error
  }
}

const finishMachineUsage = async (machineId, roomNumber) => {
  try {
    const actualEndTime = new Date().toISOString()
    
    // Update room_machine_usage
    const updateResult = await client.execute(
      `UPDATE room_machine_usage 
       SET actual_end_time = ?, is_active = 0, updated_at = CURRENT_TIMESTAMP 
       WHERE machine_id = ? AND room_number = ? AND is_active = 1`,
      [actualEndTime, machineId, roomNumber]
    )
    
    // Get usage details for history
    const usageResult = await client.execute(
      `SELECT rmu.*, wm.name as machine_name, wm.type as machine_type
       FROM room_machine_usage rmu
       JOIN washing_machines wm ON rmu.machine_id = wm.id
       WHERE rmu.machine_id = ? AND rmu.room_number = ? AND rmu.actual_end_time = ?`,
      [machineId, roomNumber, actualEndTime]
    )
    
    if (usageResult.rows.length > 0) {
      const usage = usageResult.rows[0]
      const startTime = new Date(usage.start_time)
      const endTime = new Date(actualEndTime)
      
      // Validate dates
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        console.error('Invalid date values:', { startTime: usage.start_time, endTime: actualEndTime })
        throw new Error('Invalid date values for duration calculation')
      }
      
      const durationMinutes = Math.round((endTime - startTime) / (1000 * 60))
      
      console.log('Duration calculation:', {
        startTime: usage.start_time,
        endTime: actualEndTime,
        durationMinutes
      })
      
      // Add to history
      await addHistoryRecord({
        machineId: usage.machine_id,
        machineType: usage.machine_type,
        machineName: usage.machine_name,
        roomNumber: usage.room_number,
        ipAddress: usage.ip_address,
        durationMinutes: Math.max(0, durationMinutes), // Ensure non-negative
        notes: usage.notes || '',
        startTime: usage.start_time,
        endTime: actualEndTime
      })
    }
    
    // Verify no active usage exists before updating machine status
    const activeUsage = await client.execute(
      'SELECT COUNT(*) as count FROM room_machine_usage WHERE machine_id = ? AND is_active = 1',
      [machineId]
    )
    
    if (activeUsage.rows[0].count > 0) {
      console.warn(`⚠️ Machine ${machineId} still has active usage, something went wrong`)
    }
    
    // Update machine status to available
    console.log(`🔄 Updating machine ${machineId} status to available`)
    await updateMachine(machineId, {
      status: 'available',
      currentRoomNumber: '',
      currentUserIP: '',
      currentNote: '',
      startTime: null,
      estimatedEndTime: null
    })
    console.log(`✅ Machine ${machineId} status updated to available`)
    
    console.log('Update result structure:', updateResult)
    
    // Handle different database response structures for changes count
    let changesCount = 0;
    if (updateResult.meta && updateResult.meta.changes !== undefined) {
      changesCount = updateResult.meta.changes;
    } else if (updateResult.changes !== undefined) {
      changesCount = updateResult.changes;
    } else if (updateResult.rowsAffected !== undefined) {
      changesCount = updateResult.rowsAffected;
    } else {
      // Fallback: assume success if no error occurred
      changesCount = 1;
      console.log('Warning: Could not get changes count, assuming success');
    }
    
    return changesCount > 0
  } catch (error) {
    console.error('Error finishing machine usage:', error)
    throw error
  }
}

const updateMachineUsageNotes = async (machineId, roomNumber, notes) => {
  try {
    const result = await client.execute(
      `UPDATE room_machine_usage 
       SET notes = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE machine_id = ? AND room_number = ? AND is_active = 1`,
      [notes || '', machineId, roomNumber]
    )
    
    // Also update machine's current note
    await updateMachine(machineId, {
      currentNote: notes || ''
    })
    
    let changesCount = 0;
    if (result.meta && result.meta.changes !== undefined) {
      changesCount = result.meta.changes;
    } else if (result.changes !== undefined) {
      changesCount = result.changes;
    } else if (result.rowsAffected !== undefined) {
      changesCount = result.rowsAffected;
    } else {
      changesCount = 1;
    }
    
    return changesCount > 0
  } catch (error) {
    console.error('Error updating machine usage notes:', error)
    throw error
  }
}

// ============= HISTORY OPERATIONS =============

const getHistory = async (limit = 50) => {
  try {
    const result = await client.execute(
      'SELECT * FROM washing_history ORDER BY start_time DESC LIMIT ?',
      [limit]
    )
    return result.rows.map(row => convertBigIntToNumber({
      id: row.id,
      machineId: row.machine_id,
      machineType: row.machine_type,
      machineName: row.machine_name,
      roomNumber: row.room_number,
      ipAddress: row.ip_address,
      durationMinutes: row.duration_minutes,
      notes: row.notes || '',
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
    const {
      machineId,
      machineType,
      machineName,
      roomNumber,
      ipAddress,
      durationMinutes,
      notes,
      startTime,
      endTime
    } = record
    
    const result = await client.execute(
      `INSERT INTO washing_history 
       (machine_id, machine_type, machine_name, room_number, ip_address, duration_minutes, notes, start_time, end_time) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [machineId, machineType, machineName, roomNumber, ipAddress, durationMinutes, notes || '', startTime, endTime]
    )
    
    console.log('History insert result structure:', result)
    
    // Handle different database response structures
    let insertId;
    if (result.meta && result.meta.last_insert_rowid) {
      insertId = result.meta.last_insert_rowid;
    } else if (result.lastInsertRowid) {
      insertId = result.lastInsertRowid;
    } else if (result.insertId) {
      insertId = result.insertId;
    } else {
      // Fallback: use current timestamp as ID
      insertId = Date.now();
      console.log('Warning: Could not get history insert ID, using timestamp fallback:', insertId);
    }
    
    // Convert BigInt to Number for JSON serialization
    if (typeof insertId === 'bigint') {
      insertId = Number(insertId);
    }
    
    return {
      id: insertId,
      ...record
    }
  } catch (error) {
    console.error('Error adding history record:', error)
    throw error
  }
}

// ============= QUEUE OPERATIONS =============

const getQueue = async (machineType = null) => {
  try {
    let query = 'SELECT * FROM queue'
    let params = []
    
    if (machineType) {
      query += ' WHERE machine_type = ? OR machine_type = "any"'
      params.push(machineType)
    }
    
    query += ' ORDER BY position, joined_at'
    
    const result = await client.execute(query, params)
    return result.rows.map(row => convertBigIntToNumber({
      id: row.id,
      roomNumber: row.room_number,
      phoneNumber: row.phone_number || '',
      ipAddress: row.ip_address,
      machineType: row.machine_type,
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
    const { 
      roomNumber, 
      phoneNumber = '', 
      ipAddress, 
      machineType = 'any' 
    } = queueData
    
    // Ensure all values are properly set
    const cleanedData = {
      roomNumber: String(roomNumber || ''),
      phoneNumber: String(phoneNumber || ''),
      ipAddress: String(ipAddress || ''),
      machineType: String(machineType || 'any')
    }
    
    console.log('Adding to queue:', cleanedData)
    
    // Check if IP is already in queue for this machine type
    const existingEntry = await client.execute(
      'SELECT * FROM queue WHERE ip_address = ? AND (machine_type = ? OR machine_type = "any")',
      [cleanedData.ipAddress, cleanedData.machineType]
    )
    
    if (existingEntry.rows.length > 0) {
      throw new Error('IP already in queue for this machine type')
    }
    
    // Get next position
    const positionResult = await client.execute(
      'SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM queue WHERE machine_type = ? OR machine_type = "any"',
      [cleanedData.machineType]
    )
    let nextPosition = positionResult.rows[0].next_position
    
    console.log('Position result:', nextPosition, typeof nextPosition)
    
    // Convert BigInt to Number if needed
    if (typeof nextPosition === 'bigint') {
      nextPosition = Number(nextPosition)
    }
    
    // Use cleaned data for insert
    const params = [
      cleanedData.roomNumber,
      cleanedData.phoneNumber,
      cleanedData.ipAddress,
      cleanedData.machineType,
      Number(nextPosition || 1)
    ]
    
    console.log('Insert params:', params)
    
    await client.execute(
      'INSERT INTO queue (room_number, phone_number, ip_address, machine_type, position) VALUES (?, ?, ?, ?, ?)',
      params
    )
    
    return await getQueue(cleanedData.machineType)
  } catch (error) {
    console.error('Error adding to queue:', error)
    throw error
  }
}

const removeFromQueue = async (ipAddress, machineType = null) => {
  try {
    let query = 'DELETE FROM queue WHERE ip_address = ?'
    let params = [ipAddress]
    
    if (machineType) {
      query += ' AND (machine_type = ? OR machine_type = "any")'
      params.push(machineType)
    }
    
    await client.execute(query, params)
    
    // Reorder positions
    await client.execute(`
      UPDATE queue SET position = (
        SELECT COUNT(*) FROM queue q2 
        WHERE q2.joined_at <= queue.joined_at 
        AND (q2.machine_type = queue.machine_type OR q2.machine_type = "any" OR queue.machine_type = "any")
      )
    `)
    
    return await getQueue(machineType)
  } catch (error) {
    console.error('Error removing from queue:', error)
    throw error
  }
}

const getNextInQueue = async (machineType = null) => {
  try {
    let query = 'SELECT * FROM queue'
    let params = []
    
    if (machineType) {
      query += ' WHERE machine_type = ? OR machine_type = "any"'
      params.push(machineType)
    }
    
    query += ' ORDER BY position, joined_at LIMIT 1'
    
    const result = await client.execute(query, params)
    if (result.rows.length === 0) return null
    
    const row = result.rows[0]
    return {
      id: row.id,
      roomNumber: row.room_number,
      phoneNumber: row.phone_number || '',
      ipAddress: row.ip_address,
      machineType: row.machine_type,
      position: row.position,
      joinedAt: row.joined_at,
      createdAt: row.created_at
    }
  } catch (error) {
    console.error('Error getting next in queue:', error)
    throw error
  }
}

// ============= STATISTICS =============

const getStatistics = async () => {
  try {
    // Total machines by type
    const machineStats = await client.execute(`
      SELECT type, COUNT(*) as total, 
             SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
             SUM(CASE WHEN status = 'in_use' THEN 1 ELSE 0 END) as in_use
      FROM washing_machines 
      GROUP BY type
    `)
    
    // Active usages
    const activeUsages = await client.execute(`
      SELECT COUNT(*) as total FROM room_machine_usage WHERE is_active = 1
    `)
    
    // Queue sizes
    const queueStats = await client.execute(`
      SELECT machine_type, COUNT(*) as total FROM queue GROUP BY machine_type
    `)
    
    // Today's usage
    const todayUsage = await client.execute(`
      SELECT COUNT(*) as total, SUM(duration_minutes) as total_minutes
      FROM washing_history 
      WHERE DATE(start_time) = DATE('now')
    `)
    
    return {
      machines: machineStats.rows.map(row => ({
        type: row.type,
        total: row.total,
        available: row.available,
        inUse: row.in_use
      })),
      activeUsages: activeUsages.rows[0].total,
      queues: queueStats.rows.map(row => ({
        machineType: row.machine_type,
        total: row.total
      })),
      todayUsage: {
        totalSessions: todayUsage.rows[0].total || 0,
        totalMinutes: todayUsage.rows[0].total_minutes || 0
      }
    }
  } catch (error) {
    console.error('Error getting statistics:', error)
    throw error
  }
}

module.exports = {
  initializeDatabase,
  client,
  
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
} 
