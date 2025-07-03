const { BaseRepository } = require('./BaseRepository')

class QueueRepository extends BaseRepository {
  constructor() {
    super('queue')
  }

  async findByType(machineType = null) {
    const client = await this.getClient()
    const query = machineType 
      ? `SELECT * FROM ${this.tableName} WHERE machine_type = ? OR machine_type = 'any' ORDER BY position`
      : `SELECT * FROM ${this.tableName} ORDER BY position`
    
    const params = machineType ? [machineType] : []
    const result = await client.execute(query, params)
    return result.rows.map(row => this.convertBigIntToNumber(row))
  }

  async findByIP(ipAddress) {
    const client = await this.getClient()
    const result = await client.execute(
      `SELECT * FROM ${this.tableName} WHERE ip_address = ?`,
      [ipAddress]
    )
    return result.rows.length > 0 ? this.convertBigIntToNumber(result.rows[0]) : null
  }

  async addToQueue(queueData) {
    const client = await this.getClient()
    
    // Check if IP already in queue
    const existing = await this.findByIP(queueData.ip_address)
    if (existing) {
      throw new Error('IP already in queue')
    }
    
    // Get next position
    const positionResult = await client.execute(
      `SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM ${this.tableName}`
    )
    const nextPosition = positionResult.rows[0].next_position
    
    const dataWithPosition = { 
      ...queueData, 
      position: nextPosition,
      joined_at: new Date().toISOString()
    }
    
    return await this.create(dataWithPosition)
  }

  async removeFromQueue(ipAddress) {
    const client = await this.getClient()
    
    // Get the item to remove
    const item = await this.findByIP(ipAddress)
    if (!item) {
      return await this.findByType() // Return current queue
    }
    
    // Remove the item
    await client.execute(`DELETE FROM ${this.tableName} WHERE ip_address = ?`, [ipAddress])
    
    // Reorder positions
    await client.execute(
      `UPDATE ${this.tableName} SET position = position - 1 WHERE position > ?`,
      [item.position]
    )
    
    return await this.findByType()
  }

  async getNext(machineType = null) {
    const queue = await this.findByType(machineType)
    return queue.length > 0 ? queue[0] : null
  }

  async clearQueue() {
    const client = await this.getClient()
    await client.execute(`DELETE FROM ${this.tableName}`)
    return true
  }

  async getQueuePosition(ipAddress) {
    const item = await this.findByIP(ipAddress)
    return item ? item.position : null
  }

  async getQueueLength(machineType = null) {
    const queue = await this.findByType(machineType)
    return queue.length
  }

  // Convert to domain object
  toDomainObject(row) {
    if (!row) return null
    
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
  }

  async findAllDomain(machineType = null) {
    const rows = await this.findByType(machineType)
    return rows.map(row => this.toDomainObject(row))
  }
}

module.exports = QueueRepository 
