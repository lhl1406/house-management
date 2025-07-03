const MachineRepository = require('./MachineRepository')
const RoomRepository = require('./RoomRepository')
const QueueRepository = require('./QueueRepository')
const HistoryRepository = require('./HistoryRepository')

// Repository Factory Pattern
class RepositoryFactory {
  constructor() {
    this.repositories = new Map()
  }

  create(type) {
    // Return singleton instances
    if (this.repositories.has(type)) {
      return this.repositories.get(type)
    }

    let repository
    switch (type.toLowerCase()) {
      case 'machine':
        repository = new MachineRepository()
        break
      case 'room':
        repository = new RoomRepository()
        break
      case 'queue':
        repository = new QueueRepository()
        break
      case 'history':
        repository = new HistoryRepository()
        break
      default:
        throw new Error(`Unknown repository type: ${type}`)
    }

    this.repositories.set(type, repository)
    return repository
  }

  // Convenience methods
  createMachineRepository() {
    return this.create('machine')
  }

  createRoomRepository() {
    return this.create('room')
  }

  createQueueRepository() {
    return this.create('queue')
  }

  createHistoryRepository() {
    return this.create('history')
  }

  // Clear cache for testing
  clearCache() {
    this.repositories.clear()
  }
}

// Singleton instance
let factoryInstance = null

const getRepositoryFactory = () => {
  if (!factoryInstance) {
    factoryInstance = new RepositoryFactory()
  }
  return factoryInstance
}

module.exports = {
  RepositoryFactory,
  getRepositoryFactory
} 
