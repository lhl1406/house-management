const { initializeDatabase, getMachineState, updateMachineState, getHistory, addHistoryRecord } = require('./db')

async function testDatabase() {
  console.log('🔄 Testing Turso DB connection...')
  
  try {
    // Initialize database
    console.log('1. Initializing database...')
    await initializeDatabase()
    console.log('✅ Database initialized successfully')
    
    // Test machine state
    console.log('\n2. Testing machine state...')
    const currentState = await getMachineState()
    console.log('Current state:', currentState)
    
    // Update machine state
    console.log('\n3. Testing state update...')
    const testState = {
      isWashing: true,
      isDrying: false,
      washTime: 1200,
      dryTime: 0,
      selectedRoom: 'Test Room 101',
      currentNote: 'Database test'
    }
    
    const updatedState = await updateMachineState(testState)
    console.log('Updated state:', updatedState)
    
    // Test history
    console.log('\n4. Testing history...')
    const testRecord = {
      room: 'Test Room 101',
      washTime: 1200,
      dryTime: 800,
      totalTime: 2000,
      note: 'Test wash cycle',
      date: new Date().toISOString()
    }
    
    const newRecord = await addHistoryRecord(testRecord)
    console.log('Added history record:', newRecord)
    
    // Get history
    const history = await getHistory()
    console.log('History count:', history.length)
    console.log('Latest record:', history[0])
    
    // Reset state for clean testing
    console.log('\n5. Resetting state...')
    await updateMachineState({
      isWashing: false,
      isDrying: false,
      washTime: 0,
      dryTime: 0,
      selectedRoom: '',
      currentNote: ''
    })
    
    console.log('\n🎉 All tests passed! Turso DB is working correctly.')
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
    process.exit(1)
  }
}

// Run tests
testDatabase() 
