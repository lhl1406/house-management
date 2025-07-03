const { BaseRepository } = require('./BaseRepository')

class MachineRepository extends BaseRepository {
  constructor() {
    super('washing_machines')
  }

  async findByType(type) {
    const client = await this.getClient()
    const result = await client.execute(
      `SELECT * FROM ${this.tableName} WHERE type = ? ORDER BY id`,
      [type]
    )
    return result.rows.map(row => this.convertBigIntToNumber(row))
  }

  async findAvailable(type = null) {
    const client = await this.getClient()
    const query = type 
      ? `SELECT * FROM ${this.tableName} WHERE status = 'available' AND type = ? ORDER BY id`
      : `SELECT * FROM ${this.tableName} WHERE status = 'available' ORDER BY id`
    
    const params = type ? [type] : []
    const result = await client.execute(query, params)
    return result.rows.map(row => this.convertBigIntToNumber(row))
  }

  async findByRoomAndStatus(roomNumber, status = 'in_use') {
    const client = await this.getClient()
    const result = await client.execute(
      `SELECT * FROM ${this.tableName} WHERE current_room_number = ? AND status = ?`,
      [roomNumber, status]
    )
    return result.rows.map(row => this.convertBigIntToNumber(row))
  }

  async updateStatus(id, status, additionalData = {}) {
    const updateData = { status, ...additionalData }
    return await this.update(id, updateData)
  }

  async startMachine(id, roomNumber, userIP, estimatedEndTime, notes = '') {
    return await this.updateStatus(id, 'in_use', {
      current_room_number: roomNumber,
      current_user_ip: userIP,
      current_note: notes,
      start_time: new Date().toISOString(),
      estimated_end_time: estimatedEndTime
    })
  }

  async finishMachine(id) {
    return await this.updateStatus(id, 'available', {
      current_room_number: '',
      current_user_ip: '',
      current_note: '',
      start_time: null,
      estimated_end_time: null
    })
  }

  // Convert database row to domain object
  toDomainObject(row) {
    if (!row) return null
    
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
  }

  async findAllDomain() {
    const rows = await this.findAll()
    return rows.map(row => this.toDomainObject(row))
  }

  async findByIdDomain(id) {
    const row = await this.findById(id)
    return this.toDomainObject(row)
  }
}

module.exports = MachineRepository 
