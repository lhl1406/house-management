const { BaseRepository } = require('./BaseRepository')

class RoomRepository extends BaseRepository {
  constructor() {
    super('rooms')
  }

  async findByRoomNumber(roomNumber) {
    const client = await this.getClient()
    const result = await client.execute(
      `SELECT * FROM ${this.tableName} WHERE room_number = ?`,
      [roomNumber]
    )
    return result.rows.length > 0 ? this.convertBigIntToNumber(result.rows[0]) : null
  }

  async findByIP(ipAddress) {
    const client = await this.getClient()
    const result = await client.execute(
      `SELECT * FROM ${this.tableName} WHERE ip_address = ?`,
      [ipAddress]
    )
    return result.rows.length > 0 ? this.convertBigIntToNumber(result.rows[0]) : null
  }

  async findActive() {
    const client = await this.getClient()
    const result = await client.execute(
      `SELECT * FROM ${this.tableName} WHERE is_active = 1 ORDER BY room_number`
    )
    return result.rows.map(row => this.convertBigIntToNumber(row))
  }

  async createOrUpdate(roomData) {
    const existing = await this.findByRoomNumber(roomData.room_number)
    
    if (existing) {
      return await this.update(existing.id, roomData)
    } else {
      return await this.create(roomData)
    }
  }

  async updatePhoneNumber(roomNumber, phoneNumber) {
    const room = await this.findByRoomNumber(roomNumber)
    if (!room) {
      throw new Error(`Room ${roomNumber} not found`)
    }
    
    return await this.update(room.id, { phone_number: phoneNumber })
  }

  async deactivateRoom(roomNumber) {
    const room = await this.findByRoomNumber(roomNumber)
    if (!room) {
      throw new Error(`Room ${roomNumber} not found`)
    }
    
    return await this.update(room.id, { is_active: 0 })
  }

  // Convert to domain object
  toDomainObject(row) {
    if (!row) return null
    
    return {
      id: row.id,
      roomNumber: row.room_number,
      phoneNumber: row.phone_number || '',
      ipAddress: row.ip_address,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  async findAllDomain() {
    const rows = await this.findAll('room_number')
    return rows.map(row => this.toDomainObject(row))
  }

  async findByRoomNumberDomain(roomNumber) {
    const row = await this.findByRoomNumber(roomNumber)
    return this.toDomainObject(row)
  }
}

module.exports = RoomRepository 
