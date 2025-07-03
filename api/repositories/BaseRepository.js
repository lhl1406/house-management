const { createClient } = require('@libsql/client')
require('dotenv').config()

// Singleton Database Connection
class DatabaseConnection {
  constructor() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance
    }
    
    this.client = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    
    this.isInitialized = false
    DatabaseConnection.instance = this
  }

  async initialize() {
    if (this.isInitialized) {
      return this.client
    }
    
    try {
      await this.initializeTables()
      this.isInitialized = true
      console.log('✅ Database connection established')
      return this.client
    } catch (error) {
      console.error('❌ Failed to initialize database:', error)
      throw error
    }
  }

  async initializeTables() {
    // Create washing_machines table
    await this.client.execute(`
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

    // Create rooms table
    await this.client.execute(`
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

    // Create room_machine_usage table
    await this.client.execute(`
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

    // Create washing_history table
    await this.client.execute(`
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

    // Create queue table
    await this.client.execute(`
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

    // Insert default machines if not exists
    const existingMachines = await this.client.execute('SELECT COUNT(*) as count FROM washing_machines')
    if (existingMachines.rows[0].count === 0) {
      await this.client.execute(`INSERT INTO washing_machines (name, type, status) VALUES (?, ?, ?)`, ['Máy Giặt 1', 'washing', 'available'])
      await this.client.execute(`INSERT INTO washing_machines (name, type, status) VALUES (?, ?, ?)`, ['Máy Giặt 2', 'washing', 'available'])
      await this.client.execute(`INSERT INTO washing_machines (name, type, status) VALUES (?, ?, ?)`, ['Máy Sấy 1', 'drying', 'available'])
      await this.client.execute(`INSERT INTO washing_machines (name, type, status) VALUES (?, ?, ?)`, ['Máy Sấy 2', 'drying', 'available'])
    }
  }

  getClient() {
    return this.client
  }

  static getInstance() {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection()
    }
    return DatabaseConnection.instance
  }
}

// Base Repository with common CRUD operations
class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName
    this.db = DatabaseConnection.getInstance()
  }

  async getClient() {
    return await this.db.initialize()
  }

  // Helper method to convert BigInt to Number for JSON serialization
  convertBigIntToNumber(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return Number(obj);
    if (typeof obj === 'object' && !Array.isArray(obj)) {
      const converted = {};
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = this.convertBigIntToNumber(value);
      }
      return converted;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertBigIntToNumber(item));
    }
    return obj;
  }

  async findAll(orderBy = 'id') {
    const client = await this.getClient()
    const result = await client.execute(`SELECT * FROM ${this.tableName} ORDER BY ${orderBy}`)
    return result.rows.map(row => this.convertBigIntToNumber(row))
  }

  async findById(id) {
    const client = await this.getClient()
    const result = await client.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id])
    return result.rows.length > 0 ? this.convertBigIntToNumber(result.rows[0]) : null
  }

  async create(data) {
    const client = await this.getClient()
    const columns = Object.keys(data)
    const placeholders = columns.map(() => '?').join(', ')
    const values = Object.values(data)
    
    const result = await client.execute(
      `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    )
    
    return this.findById(result.lastInsertRowid)
  }

  async update(id, data) {
    const client = await this.getClient()
    const columns = Object.keys(data)
    const setClause = columns.map(col => `${col} = ?`).join(', ')
    const values = [...Object.values(data), id]
    
    await client.execute(
      `UPDATE ${this.tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    )
    
    return this.findById(id)
  }

  async delete(id) {
    const client = await this.getClient()
    const result = await client.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id])
    return result.rowsAffected > 0
  }
}

module.exports = {
  DatabaseConnection,
  BaseRepository
} 
