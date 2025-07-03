const { getRepositoryFactory } = require('../repositories/RepositoryFactory')

class QueueService {
  constructor() {
    const factory = getRepositoryFactory()
    this.queueRepo = factory.createQueueRepository()
    this.roomRepo = factory.createRoomRepository()
  }

  async getQueue(machineType = null) {
    try {
      return await this.queueRepo.findAllDomain(machineType)
    } catch (error) {
      console.error('Error getting queue:', error)
      throw new Error('Unable to retrieve queue')
    }
  }

  async joinQueue(roomNumber, phoneNumber = '', ipAddress, machineType = 'any') {
    try {
      // Validate input
      if (!roomNumber || !ipAddress) {
        throw new Error('Room number and IP address are required')
      }

      // Check if IP already in queue
      const existing = await this.queueRepo.findByIP(ipAddress)
      if (existing) {
        throw new Error('IP already in queue')
      }

      // Ensure room exists
      await this.roomRepo.createOrUpdate({
        room_number: roomNumber,
        ip_address: ipAddress,
        phone_number: phoneNumber,
        is_active: 1
      })

      // Add to queue
      const queueItem = await this.queueRepo.addToQueue({
        room_number: roomNumber,
        phone_number: phoneNumber,
        ip_address: ipAddress,
        machine_type: machineType
      })

      console.log(`🔄 ${roomNumber} joined queue at position ${queueItem.position}`)
      
      return {
        success: true,
        message: `${roomNumber} đã được thêm vào hàng đợi`,
        position: queueItem.position,
        queueItem: this.queueRepo.toDomainObject(queueItem)
      }
    } catch (error) {
      console.error('Error joining queue:', error)
      throw error
    }
  }

  async leaveQueue(ipAddress, roomNumber = null) {
    try {
      if (!ipAddress) {
        throw new Error('IP address is required')
      }

      // Find user in queue
      const userInQueue = await this.queueRepo.findByIP(ipAddress)
      if (!userInQueue) {
        throw new Error('IP not found in queue')
      }

      // Additional validation if room is provided
      if (roomNumber && userInQueue.room_number !== roomNumber) {
        throw new Error('Room number does not match queue record')
      }

      // Remove from queue
      const updatedQueue = await this.queueRepo.removeFromQueue(ipAddress)
      
      console.log(`🚪 ${userInQueue.room_number} left the queue`)
      
      return {
        success: true,
        message: `${userInQueue.room_number} đã rời khỏi hàng đợi`,
        queue: updatedQueue.map(item => this.queueRepo.toDomainObject(item))
      }
    } catch (error) {
      console.error('Error leaving queue:', error)
      throw error
    }
  }

  async getNextInQueue(machineType = null) {
    try {
      const nextUser = await this.queueRepo.getNext(machineType)
      return nextUser ? this.queueRepo.toDomainObject(nextUser) : null
    } catch (error) {
      console.error('Error getting next in queue:', error)
      throw error
    }
  }

  async processNextInQueue(machineType = null) {
    try {
      const nextUser = await this.getNextInQueue(machineType)
      
      if (!nextUser) {
        return {
          success: true,
          message: 'Queue is empty',
          queue: []
        }
      }

      // Remove user from queue
      const updatedQueue = await this.queueRepo.removeFromQueue(nextUser.ipAddress)
      
      console.log(`🔔 Processing next user: ${nextUser.roomNumber}`)
      
      return {
        success: true,
        message: `Đã thông báo cho ${nextUser.roomNumber}`,
        nextUser: nextUser,
        queue: updatedQueue.map(item => this.queueRepo.toDomainObject(item))
      }
    } catch (error) {
      console.error('Error processing next in queue:', error)
      throw error
    }
  }

  async getQueuePosition(ipAddress) {
    try {
      const position = await this.queueRepo.getQueuePosition(ipAddress)
      return position
    } catch (error) {
      console.error('Error getting queue position:', error)
      throw error
    }
  }

  async getQueueLength(machineType = null) {
    try {
      return await this.queueRepo.getQueueLength(machineType)
    } catch (error) {
      console.error('Error getting queue length:', error)
      throw error
    }
  }

  async isInQueue(ipAddress) {
    try {
      const item = await this.queueRepo.findByIP(ipAddress)
      return item !== null
    } catch (error) {
      console.error('Error checking if in queue:', error)
      throw error
    }
  }

  async getQueueInfo(ipAddress) {
    try {
      const item = await this.queueRepo.findByIP(ipAddress)
      return item ? this.queueRepo.toDomainObject(item) : null
    } catch (error) {
      console.error('Error getting queue info:', error)
      throw error
    }
  }

  async clearQueue() {
    try {
      await this.queueRepo.clearQueue()
      console.log('🧹 Queue cleared')
      return { success: true, message: 'Queue cleared' }
    } catch (error) {
      console.error('Error clearing queue:', error)
      throw error
    }
  }
}

// Singleton pattern
let queueServiceInstance = null

const getQueueService = () => {
  if (!queueServiceInstance) {
    queueServiceInstance = new QueueService()
  }
  return queueServiceInstance
}

module.exports = {
  QueueService,
  getQueueService
} 
