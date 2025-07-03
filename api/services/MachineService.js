const { getRepositoryFactory } = require('../repositories/RepositoryFactory')

// Observer Pattern for notifications
class MachineObserver {
  constructor() {
    this.observers = []
  }

  subscribe(observer) {
    this.observers.push(observer)
  }

  unsubscribe(observer) {
    this.observers = this.observers.filter(obs => obs !== observer)
  }

  async notify(event, data) {
    console.log(`📢 Machine event: ${event}`)
    
    const notifications = this.observers.map(observer => 
      observer.update(event, data).catch(error => 
        console.error(`Observer notification failed:`, error)
      )
    )
    
    await Promise.allSettled(notifications)
  }
}

// Concrete Observer for History
class HistoryObserver {
  constructor(historyRepo) {
    this.historyRepo = historyRepo
  }

  async update(event, data) {
    if (event === 'MACHINE_FINISHED') {
      await this.historyRepo.addRecord({
        machineId: data.machineId,
        machineType: data.machineType,
        machineName: data.machineName,
        roomNumber: data.roomNumber,
        ipAddress: data.ipAddress,
        durationMinutes: data.durationMinutes,
        notes: data.notes || '',
        startTime: data.startTime,
        endTime: data.endTime
      })
      console.log(`📝 History record added for ${data.machineName}`)
    }
  }
}

// Concrete Observer for Notifications
class NotificationObserver {
  async update(event, data) {
    switch (event) {
      case 'MACHINE_STARTED':
        console.log(`📱 Notification: ${data.machineName} started for room ${data.roomNumber}`)
        break
      case 'MACHINE_FINISHED':
        console.log(`📱 Notification: ${data.machineName} finished for room ${data.roomNumber}`)
        if (data.phoneNumber) {
          console.log(`📞 Would send Zalo to ${data.phoneNumber}`)
        }
        break
      case 'MACHINE_AVAILABLE':
        console.log(`📱 Notification: ${data.machineName} is now available`)
        break
    }
  }
}

// Concrete Observer for Queue Management
class QueueObserver {
  constructor(queueRepo) {
    this.queueRepo = queueRepo
  }

  async update(event, data) {
    if (event === 'MACHINE_AVAILABLE') {
      const nextUser = await this.queueRepo.getNext(data.machineType)
      if (nextUser) {
        console.log(`🔔 Notifying next user in queue: ${nextUser.room_number}`)
        // In real implementation, would send notification to next user
      }
    }
  }
}

// Machine Service with Business Logic
class MachineService {
  constructor() {
    const factory = getRepositoryFactory()
    this.machineRepo = factory.createMachineRepository()
    this.roomRepo = factory.createRoomRepository()
    this.historyRepo = factory.createHistoryRepository()
    this.queueRepo = factory.createQueueRepository()
    
    // Observer pattern setup
    this.observer = new MachineObserver()
    this.setupObservers()
  }

  setupObservers() {
    const historyObserver = new HistoryObserver(this.historyRepo)
    const notificationObserver = new NotificationObserver()
    const queueObserver = new QueueObserver(this.queueRepo)
    
    this.observer.subscribe(historyObserver)
    this.observer.subscribe(notificationObserver)
    this.observer.subscribe(queueObserver)
  }

  // SOLID: Single Responsibility - Each method has one clear purpose
  async getAllMachines() {
    try {
      return await this.machineRepo.findAllDomain()
    } catch (error) {
      console.error('Error getting machines:', error)
      throw new Error('Unable to retrieve machines')
    }
  }

  async getMachineById(id) {
    try {
      const machine = await this.machineRepo.findByIdDomain(id)
      if (!machine) {
        throw new Error(`Machine with ID ${id} not found`)
      }
      return machine
    } catch (error) {
      console.error('Error getting machine:', error)
      throw error
    }
  }

  async getAvailableMachines(type = null) {
    try {
      const machines = await this.machineRepo.findAvailable(type)
      return machines.map(m => this.machineRepo.toDomainObject(m))
    } catch (error) {
      console.error('Error getting available machines:', error)
      throw new Error('Unable to retrieve available machines')
    }
  }

  // SOLID: Open/Closed - Open for extension via observers
  async startMachine(machineId, roomNumber, userIP, estimatedEndTime, notes = '', phoneNumber = '') {
    try {
      // Validate machine
      const machine = await this.machineRepo.findById(machineId)
      if (!machine) {
        throw new Error(`Machine with ID ${machineId} not found`)
      }

      if (machine.status !== 'available') {
        throw new Error(`Machine ${machine.name} is not available`)
      }

      // Start machine
      const updatedMachine = await this.machineRepo.startMachine(
        machineId, 
        roomNumber, 
        userIP, 
        estimatedEndTime, 
        notes
      )

      // Ensure room exists
      await this.roomRepo.createOrUpdate({
        room_number: roomNumber,
        ip_address: userIP,
        phone_number: phoneNumber || '',
        is_active: 1
      })

      // Observer pattern - notify all subscribers
      await this.observer.notify('MACHINE_STARTED', {
        machineId: machineId,
        machineType: machine.type,
        machineName: machine.name,
        roomNumber: roomNumber,
        ipAddress: userIP,
        phoneNumber: phoneNumber,
        notes: notes,
        startTime: updatedMachine.start_time,
        estimatedEndTime: estimatedEndTime
      })

      return this.machineRepo.toDomainObject(updatedMachine)
    } catch (error) {
      console.error('Error starting machine:', error)
      throw error
    }
  }

  async finishMachine(machineId, roomNumber) {
    try {
      // Get machine and validate
      const machine = await this.machineRepo.findById(machineId)
      if (!machine) {
        throw new Error(`Machine with ID ${machineId} not found`)
      }

      if (machine.status !== 'in_use') {
        throw new Error(`Machine ${machine.name} is not currently in use`)
      }

      if (machine.current_room_number !== roomNumber) {
        throw new Error('Machine is not assigned to this room')
      }

      // Calculate duration
      const startTime = new Date(machine.start_time)
      const endTime = new Date()
      const durationMinutes = Math.round((endTime - startTime) / 60000)

      // Finish machine
      const updatedMachine = await this.machineRepo.finishMachine(machineId)

      // Get room info for phone number
      const room = await this.roomRepo.findByRoomNumber(roomNumber)

      // Observer pattern - notify completion
      await this.observer.notify('MACHINE_FINISHED', {
        machineId: machineId,
        machineType: machine.type,
        machineName: machine.name,
        roomNumber: roomNumber,
        ipAddress: machine.current_user_ip,
        phoneNumber: room ? room.phone_number : '',
        notes: machine.current_note,
        startTime: machine.start_time,
        endTime: endTime.toISOString(),
        durationMinutes: durationMinutes
      })

      // Notify that machine is available
      await this.observer.notify('MACHINE_AVAILABLE', {
        machineId: machineId,
        machineType: machine.type,
        machineName: machine.name
      })

      return this.machineRepo.toDomainObject(updatedMachine)
    } catch (error) {
      console.error('Error finishing machine:', error)
      throw error
    }
  }

  async updateMachineNotes(machineId, roomNumber, notes) {
    try {
      const machine = await this.machineRepo.findById(machineId)
      if (!machine || machine.current_room_number !== roomNumber) {
        throw new Error('Machine not found or not assigned to this room')
      }

      const updatedMachine = await this.machineRepo.update(machineId, { 
        current_note: notes 
      })
      
      return { success: true, notes, machine: this.machineRepo.toDomainObject(updatedMachine) }
    } catch (error) {
      console.error('Error updating machine notes:', error)
      throw error
    }
  }

  // SOLID: Interface Segregation - Separate methods for different concerns
  async getMachineStatistics() {
    try {
      return await this.historyRepo.getStatistics()
    } catch (error) {
      console.error('Error getting statistics:', error)
      throw new Error('Unable to retrieve statistics')
    }
  }

  async getMachineHistory(limit = 50) {
    try {
      return await this.historyRepo.findRecentDomain(limit)
    } catch (error) {
      console.error('Error getting history:', error)
      throw new Error('Unable to retrieve history')
    }
  }

  async getMachineHistoryByRoom(roomNumber, limit = 20) {
    try {
      return await this.historyRepo.findByRoomDomain(roomNumber, limit)
    } catch (error) {
      console.error('Error getting room history:', error)
      throw new Error('Unable to retrieve room history')
    }
  }

  // Machine State Management (legacy support)
  async getMachineState() {
    try {
      const machines = await this.getAllMachines()
      const inUseMachines = machines.filter(m => m.status === 'in_use')
      
      if (inUseMachines.length === 0) {
        return {
          isWashing: false,
          isDrying: false,
          washTime: 0,
          dryTime: 0,
          currentUserIP: '',
          machineUserIP: '',
          roomNumber: '',
          notes: '',
          phoneNumber: '',
          canUse: true,
          estimatedEndTime: null
        }
      }

      const washingMachine = inUseMachines.find(m => m.type === 'washing')
      const dryingMachine = inUseMachines.find(m => m.type === 'drying')
      
      const isWashing = !!washingMachine
      const isDrying = !!dryingMachine
      
      // Use the first active machine for user info
      const activeMachine = inUseMachines[0]
      const currentUserIP = activeMachine.currentUserIP || ''
      
      // Calculate remaining time for wash/dry
      let washTime = 0
      let dryTime = 0
      
      if (washingMachine && washingMachine.estimatedEndTime) {
        const remaining = new Date(washingMachine.estimatedEndTime) - new Date()
        washTime = Math.max(0, Math.round(remaining / 1000))
      }
      
      if (dryingMachine && dryingMachine.estimatedEndTime) {
        const remaining = new Date(dryingMachine.estimatedEndTime) - new Date()
        dryTime = Math.max(0, Math.round(remaining / 1000))
      }

      return {
        isWashing,
        isDrying,
        washTime,
        dryTime,
        currentUserIP,
        machineUserIP: currentUserIP,
        roomNumber: activeMachine.currentRoomNumber || '',
        notes: activeMachine.currentNote || '',
        phoneNumber: '', // Will be filled from room data if needed
        canUse: false,
        estimatedEndTime: activeMachine.estimatedEndTime
      }
    } catch (error) {
      console.error('Error getting machine state:', error)
      throw error
    }
  }

  async updateMachineState(newState, clientIP) {
    try {
      console.log('Updating machine state:', newState, 'from IP:', clientIP)
      
      // Get current state
      const currentState = await this.getMachineState()
      
      // If both wash and dry are false, finish any active machines
      if (!newState.isWashing && !newState.isDrying) {
        const machines = await this.getAllMachines()
        const inUseMachines = machines.filter(m => m.status === 'in_use')
        
        for (const machine of inUseMachines) {
          if (machine.currentUserIP === clientIP || machine.currentUserIP === '') {
            try {
              await this.finishMachine(machine.id, machine.currentRoomNumber)
            } catch (err) {
              console.warn('Error finishing machine:', err.message)
            }
          }
        }
        
        return await this.getMachineState()
      }
      
      // If washing or drying is true, start appropriate machines
      if (newState.isWashing || newState.isDrying) {
        const machines = await this.getAllMachines()
        
        // Calculate estimated end time
        const washTimeMs = (newState.washTime || 0) * 1000
        const dryTimeMs = (newState.dryTime || 0) * 1000
        const totalTime = washTimeMs + dryTimeMs
        const estimatedEndTime = new Date(Date.now() + totalTime).toISOString()
        
        if (newState.isWashing && !currentState.isWashing) {
          // Start washing machine
          const washMachine = machines.find(m => m.type === 'washing' && m.status === 'available')
          if (washMachine) {
            await this.startMachine(
              washMachine.id, 
              newState.roomNumber || 'Unknown', 
              clientIP, 
              estimatedEndTime, 
              newState.notes || '',
              newState.phoneNumber || ''
            )
          }
        }
        
        if (newState.isDrying && !currentState.isDrying) {
          // Start drying machine
          const dryMachine = machines.find(m => m.type === 'drying' && m.status === 'available')
          if (dryMachine) {
            await this.startMachine(
              dryMachine.id, 
              newState.roomNumber || 'Unknown', 
              clientIP, 
              estimatedEndTime, 
              newState.notes || '',
              newState.phoneNumber || ''
            )
          }
        }
      }
      
      // Return updated state
      return await this.getMachineState()
    } catch (error) {
      console.error('Error updating machine state:', error)
      throw error
    }
  }
}

// Singleton pattern for service
let machineServiceInstance = null

const getMachineService = () => {
  if (!machineServiceInstance) {
    machineServiceInstance = new MachineService()
  }
  return machineServiceInstance
}

module.exports = {
  MachineService,
  getMachineService
} 
