const { BaseRepository } = require('./BaseRepository')

class HistoryRepository extends BaseRepository {
  constructor() {
    super('washing_history')
  }

  async findRecent(limit = 50) {
    const client = await this.getClient()
    const result = await client.execute(
      `SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT ?`,
      [limit]
    )
    return result.rows.map(row => this.convertBigIntToNumber(row))
  }

  async findByRoom(roomNumber, limit = 20) {
    const client = await this.getClient()
    const result = await client.execute(
      `SELECT * FROM ${this.tableName} WHERE room_number = ? ORDER BY created_at DESC LIMIT ?`,
      [roomNumber, limit]
    )
    return result.rows.map(row => this.convertBigIntToNumber(row))
  }

  async findByMachine(machineId, limit = 20) {
    const client = await this.getClient()
    const result = await client.execute(
      `SELECT * FROM ${this.tableName} WHERE machine_id = ? ORDER BY created_at DESC LIMIT ?`,
      [machineId, limit]
    )
    return result.rows.map(row => this.convertBigIntToNumber(row))
  }

  async findByIP(ipAddress, limit = 20) {
    const client = await this.getClient()
    const result = await client.execute(
      `SELECT * FROM ${this.tableName} WHERE ip_address = ? ORDER BY created_at DESC LIMIT ?`,
      [ipAddress, limit]
    )
    return result.rows.map(row => this.convertBigIntToNumber(row))
  }

  async findByDateRange(startDate, endDate, limit = 100) {
    const client = await this.getClient()
    const result = await client.execute(
      `SELECT * FROM ${this.tableName} 
       WHERE created_at BETWEEN ? AND ? 
       ORDER BY created_at DESC LIMIT ?`,
      [startDate, endDate, limit]
    )
    return result.rows.map(row => this.convertBigIntToNumber(row))
  }

  async getStatistics() {
    const client = await this.getClient()
    
    // Get total usage statistics
    const totalResult = await client.execute(`
      SELECT 
        COUNT(*) as total_uses,
        AVG(duration_minutes) as avg_duration,
        SUM(duration_minutes) as total_duration
      FROM ${this.tableName}
    `)
    
    // Get usage by machine type
    const typeResult = await client.execute(`
      SELECT 
        machine_type,
        COUNT(*) as count,
        AVG(duration_minutes) as avg_duration,
        SUM(duration_minutes) as total_duration
      FROM ${this.tableName}
      GROUP BY machine_type
    `)

    // Get usage by room
    const roomResult = await client.execute(`
      SELECT 
        room_number,
        COUNT(*) as count,
        AVG(duration_minutes) as avg_duration,
        SUM(duration_minutes) as total_duration
      FROM ${this.tableName}
      GROUP BY room_number
      ORDER BY count DESC
      LIMIT 10
    `)

    // Get recent activity (last 7 days)
    const recentResult = await client.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        AVG(duration_minutes) as avg_duration
      FROM ${this.tableName}
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `)
    
    return {
      total: this.convertBigIntToNumber(totalResult.rows[0]),
      byType: typeResult.rows.map(row => this.convertBigIntToNumber(row)),
      byRoom: roomResult.rows.map(row => this.convertBigIntToNumber(row)),
      recent: recentResult.rows.map(row => this.convertBigIntToNumber(row))
    }
  }

  async addRecord(record) {
    const historyData = {
      machine_id: record.machineId,
      machine_type: record.machineType,
      machine_name: record.machineName,
      room_number: record.roomNumber,
      ip_address: record.ipAddress,
      duration_minutes: record.durationMinutes || 0,
      notes: record.notes || '',
      start_time: record.startTime,
      end_time: record.endTime
    }
    
    return await this.create(historyData)
  }

  async deleteOldRecords(daysToKeep = 90) {
    const client = await this.getClient()
    const result = await client.execute(
      `DELETE FROM ${this.tableName} WHERE created_at < datetime('now', '-${daysToKeep} days')`
    )
    return result.rowsAffected
  }

  // Convert to domain object
  toDomainObject(row) {
    if (!row) return null
    
    return {
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
    }
  }

  async findRecentDomain(limit = 50) {
    const rows = await this.findRecent(limit)
    return rows.map(row => this.toDomainObject(row))
  }

  async findByRoomDomain(roomNumber, limit = 20) {
    const rows = await this.findByRoom(roomNumber, limit)
    return rows.map(row => this.toDomainObject(row))
  }
}

module.exports = HistoryRepository 
