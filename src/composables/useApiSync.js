import { ref, onUnmounted } from 'vue'

export function useApiSync() {
  const isConnected = ref(false)
  const connectionError = ref('')
  
  let pollInterval = null
  
  // API base URL - tự động phát hiện môi trường
  const getApiUrl = () => {
    // Nếu đang chạy local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3002'
    }
    // Nếu đang chạy trên Vercel hoặc production, dùng relative URL
    return window.location.origin
  }

  // Check if API is available
  const checkApiConnection = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/health`)
      if (response.ok) {
        isConnected.value = true
        connectionError.value = ''
        return true
      }
      throw new Error('API not responding')
    } catch (error) {
      isConnected.value = false
      connectionError.value = 'Không thể kết nối API'
      return false
    }
  }

  // ============= MACHINES API =============
  const getMachines = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/machines`)
      if (!response.ok) {
        throw new Error('Failed to fetch machines')
      }
      
      const data = await response.json()
      isConnected.value = true
      connectionError.value = ''
      return data
    } catch (error) {
      console.error('Error fetching machines:', error)
      connectionError.value = 'Lỗi tải máy giặt'
      isConnected.value = false
      return []
    }
  }

  const getMachine = async (id) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/machines/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch machine')
      }
      
      const data = await response.json()
      isConnected.value = true
      connectionError.value = ''
      return data
    } catch (error) {
      console.error('Error fetching machine:', error)
      connectionError.value = 'Lỗi tải máy giặt'
      isConnected.value = false
      return null
    }
  }

  const updateMachine = async (id, updates) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/machines/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update machine')
      }
      
      const data = await response.json()
      isConnected.value = true
      connectionError.value = ''
      return data
    } catch (error) {
      console.error('Error updating machine:', error)
      connectionError.value = 'Lỗi cập nhật máy giặt'
      isConnected.value = false
      throw error
    }
  }

  // ============= ROOMS API =============
  const getRooms = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/rooms`)
      if (!response.ok) {
        throw new Error('Failed to fetch rooms')
      }
      
      const data = await response.json()
      isConnected.value = true
      connectionError.value = ''
      return data
    } catch (error) {
      console.error('Error fetching rooms:', error)
      connectionError.value = 'Lỗi tải phòng'
      isConnected.value = false
      return []
    }
  }

  const getRoom = async (roomNumber) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/rooms/${roomNumber}`)
      if (!response.ok) {
        throw new Error('Failed to fetch room')
      }
      
      const data = await response.json()
      isConnected.value = true
      connectionError.value = ''
      return data
    } catch (error) {
      console.error('Error fetching room:', error)
      connectionError.value = 'Lỗi tải phòng'
      isConnected.value = false
      return null
    }
  }

  const createOrUpdateRoom = async (roomData) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create/update room')
      }
      
      const data = await response.json()
      isConnected.value = true
      connectionError.value = ''
      return data
    } catch (error) {
      console.error('Error creating/updating room:', error)
      connectionError.value = 'Lỗi tạo/cập nhật phòng'
      isConnected.value = false
      throw error
    }
  }

  const startWashing = async (roomNumber, machineId, washTime, dryTime, notes, phoneNumber) => {
    try {
      // Calculate estimated end time based on wash time and dry time
      const totalTimeSeconds = (washTime || 0) + (dryTime || 0)
      const now = new Date()
      const estimatedEndTime = new Date(now.getTime() + totalTimeSeconds * 1000).toISOString()
      
      const response = await fetch(`${getApiUrl()}/api/rooms/${roomNumber}/start-washing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          machineId: machineId || 1,
          estimatedEndTime: estimatedEndTime,
          notes: notes || '',
          phoneNumber: phoneNumber || ''
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start washing')
      }
      
      const data = await response.json()
      isConnected.value = true
      connectionError.value = ''
      return data
    } catch (error) {
      console.error('Error starting washing:', error)
      connectionError.value = 'Lỗi bắt đầu giặt'
      isConnected.value = false
      throw error
    }
  }

  const finishWashing = async (roomNumber, machineId) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/rooms/${roomNumber}/finish-washing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          machineId: machineId
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to finish washing')
      }
      
      const data = await response.json()
      isConnected.value = true
      connectionError.value = ''
      return data
    } catch (error) {
      console.error('Error finishing washing:', error)
      connectionError.value = 'Lỗi hoàn thành giặt'
      isConnected.value = false
      throw error
    }
  }

  const updateMachineNotes = async (roomNumber, machineId, notes) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/rooms/${roomNumber}/update-notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          machineId: machineId,
          notes: notes || ''
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update notes')
      }
      
      const data = await response.json()
      isConnected.value = true
      connectionError.value = ''
      return data
    } catch (error) {
      console.error('Error updating notes:', error)
      connectionError.value = 'Lỗi cập nhật ghi chú'
      isConnected.value = false
      throw error
    }
  }

  // ============= LEGACY COMPATIBILITY =============
  // Keep these for backward compatibility during transition
  const getMachineState = async () => {
    try {
      const machines = await getMachines()
      const rooms = await getRooms()
      
      // Convert new structure to old format for compatibility
      const mainMachine = machines[0] || {}
      const activeRoom = rooms.find(r => r.isUsingMachine) || {}
      
      return {
        isWashing: mainMachine.isWashing || false,
        isDrying: mainMachine.isDrying || false,
        washTime: mainMachine.washTime || 0,
        dryTime: mainMachine.dryTime || 0,
        selectedRoom: activeRoom.roomNumber || '',
        currentMachineUser: activeRoom.roomNumber || '',
        machineUserIP: activeRoom.ipAddress || '',
        currentNote: mainMachine.currentNote || '',
        status: mainMachine.status || 'available'
      }
    } catch (error) {
      console.error('Error fetching machine state:', error)
      return null
    }
  }

  const saveMachineState = async (state) => {
    try {
      // This is now handled by the new room and machine APIs
      // But we'll keep it for compatibility
      console.warn('saveMachineState is deprecated, use new room/machine APIs')
      return { success: true }
    } catch (error) {
      console.error('Error saving machine state:', error)
      throw error
    }
  }

  // Start polling for changes
  const startPolling = (callback, interval = 2000, isActiveUser = false) => {
    if (pollInterval) {
      clearInterval(pollInterval)
    }
    
    const adjustedInterval = isActiveUser ? 20000 : interval
    
    // Initial fetch
    getMachineState().then(data => {
      if (data) callback(data)
    })
    
    // Poll for changes
    pollInterval = setInterval(async () => {
      const data = await getMachineState()
      if (data) callback(data)
    }, adjustedInterval)
  }

  // Stop polling
  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  // ============= HISTORY API =============
  const getHistory = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/history`)
      if (!response.ok) {
        throw new Error('Failed to fetch history')
      }
      
      const data = await response.json()
      isConnected.value = true
      connectionError.value = ''
      return data
    } catch (error) {
      console.error('Error fetching history:', error)
      connectionError.value = 'Lỗi tải lịch sử'
      isConnected.value = false
      return []
    }
  }

  const saveToHistory = async (record) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save history')
      }
      
      isConnected.value = true
      connectionError.value = ''
    } catch (error) {
      console.error('Error saving to history:', error)
      connectionError.value = 'Lỗi lưu lịch sử'
      isConnected.value = false
    }
  }

  // ============= QUEUE API =============
  const getQueue = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/queue`)
      if (!response.ok) {
        throw new Error('Failed to fetch queue')
      }
      
      const data = await response.json()
      isConnected.value = true
      connectionError.value = ''
      return data
    } catch (error) {
      console.error('Error fetching queue:', error)
      connectionError.value = 'Lỗi tải hàng đợi'
      isConnected.value = false
      return { queue: [], clientIP: '', isInQueue: false }
    }
  }

  const joinQueue = async (room, phoneNumber = '') => {
    try {
      const response = await fetch(`${getApiUrl()}/api/queue/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ room, phoneNumber })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to join queue')
      }
      
      const data = await response.json()
      isConnected.value = true
      connectionError.value = ''
      return data
    } catch (error) {
      console.error('Error joining queue:', error)
      connectionError.value = 'Lỗi vào hàng đợi'
      isConnected.value = false
      throw error
    }
  }

  const leaveQueue = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/queue/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to leave queue')
      }
      
      const data = await response.json()
      isConnected.value = true
      connectionError.value = ''
      return data
    } catch (error) {
      console.error('Error leaving queue:', error)
      connectionError.value = 'Lỗi rời hàng đợi'
      isConnected.value = false
      throw error
    }
  }

  const processNextInQueue = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/queue/process-next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process next in queue')
      }
      
      const data = await response.json()
      isConnected.value = true
      connectionError.value = ''
      return data
    } catch (error) {
      console.error('Error processing next in queue:', error)
      connectionError.value = 'Lỗi xử lý hàng đợi'
      isConnected.value = false
      throw error
    }
  }

  // Cleanup
  onUnmounted(() => {
    stopPolling()
  })

  return {
    // Connection state
    isConnected,
    connectionError,
    checkApiConnection,
    
    // Machines API
    getMachines,
    getMachine,
    updateMachine,
    
    // Rooms API
    getRooms,
    getRoom,
    createOrUpdateRoom,
    startWashing,
    finishWashing,
    updateMachineNotes,
    
    // History API
    getHistory,
    saveToHistory,
    
    // Queue API
    getQueue,
    joinQueue,
    leaveQueue,
    processNextInQueue,
    
    // Legacy compatibility
    getMachineState,
    saveMachineState,
    startPolling,
    stopPolling
  }
} 

