const { createClient } = require('@libsql/client')
require('dotenv').config()

async function testTursoConnection() {
  console.log('🧪 Testing Turso Database Connection')
  console.log('=====================================')
  
  // Check environment variables
  console.log('\n📋 Environment Check:')
  console.log(`   TURSO_DATABASE_URL: ${process.env.TURSO_DATABASE_URL ? '✅ Set' : '❌ Missing'}`)
  console.log(`   TURSO_AUTH_TOKEN: ${process.env.TURSO_AUTH_TOKEN ? '✅ Set' : '❌ Missing'}`)
  
  if (!process.env.TURSO_DATABASE_URL) {
    console.log('\n❌ TURSO_DATABASE_URL not found in environment')
    console.log('   Please run: ./setup-turso.sh')
    process.exit(1)
  }

  // Create client
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  try {
    console.log('\n🔌 Testing connection...')
    
    // Test basic query
    const result = await client.execute('SELECT 1 as test')
    console.log('✅ Connection successful!')
    console.log(`   Test query result: ${result.rows[0].test}`)
    
    // Test table creation
    console.log('\n🛠️  Testing table operations...')
    await client.execute(`
      CREATE TABLE IF NOT EXISTS test_table (
        id INTEGER PRIMARY KEY,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Table creation successful!')
    
    // Test insert
    await client.execute(`
      INSERT OR REPLACE INTO test_table (id, name) VALUES (1, 'test')
    `)
    console.log('✅ Insert operation successful!')
    
    // Test select
    const selectResult = await client.execute('SELECT * FROM test_table WHERE id = 1')
    console.log('✅ Select operation successful!')
    console.log(`   Retrieved: ${JSON.stringify(selectResult.rows[0])}`)
    
    // Clean up
    await client.execute('DROP TABLE test_table')
    console.log('✅ Cleanup successful!')
    
    console.log('\n🎉 All tests passed! Turso database is ready to use.')
    
  } catch (error) {
    console.error('\n❌ Connection failed:')
    console.error('   Error:', error.message)
    console.log('\n💡 Troubleshooting:')
    console.log('   1. Check if your TURSO_DATABASE_URL is correct')
    console.log('   2. Verify your TURSO_AUTH_TOKEN is valid')
    console.log('   3. Ensure your database exists in Turso dashboard')
    console.log('   4. Run: ./setup-turso.sh to reconfigure')
    process.exit(1)
  } finally {
    client.close()
  }
}

testTursoConnection() 
