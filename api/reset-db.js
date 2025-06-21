#!/usr/bin/env node

const { createClient } = require('@libsql/client')
require('dotenv').config()

// Database client
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const resetDatabase = async () => {
  console.log('🗑️  Resetting database...')
  
  try {
    // Drop all existing tables
    const tables = ['machine_state', 'washing_history', 'washing_machines', 'rooms', 'queue']
    
    for (const table of tables) {
      try {
        await client.execute(`DROP TABLE IF EXISTS ${table}`)
        console.log(`✅ Dropped table: ${table}`)
      } catch (e) {
        console.log(`ℹ️  Table ${table} doesn't exist`)
      }
    }
    
    // Create new table structure
    console.log('🏗️  Creating new tables...')
    
    // Create washing_machines table
    await client.execute(`
      CREATE TABLE washing_machines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'combined',
        status TEXT NOT NULL DEFAULT 'available',
        is_washing BOOLEAN NOT NULL DEFAULT 0,
        is_drying BOOLEAN NOT NULL DEFAULT 0,
        wash_time INTEGER NOT NULL DEFAULT 0,
        dry_time INTEGER NOT NULL DEFAULT 0,
        current_user_ip TEXT DEFAULT '',
        current_note TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Created washing_machines table')

    // Create rooms table
    await client.execute(`
      CREATE TABLE rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_number TEXT NOT NULL UNIQUE,
        phone_number TEXT DEFAULT '',
        is_using_machine BOOLEAN NOT NULL DEFAULT 0,
        machine_id INTEGER,
        start_time DATETIME,
        estimated_end_time DATETIME,
        notes TEXT DEFAULT '',
        ip_address TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (machine_id) REFERENCES washing_machines(id)
      )
    `)
    console.log('✅ Created rooms table')

    // Create washing_history table
    await client.execute(`
      CREATE TABLE washing_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id INTEGER NOT NULL,
        room_number TEXT NOT NULL,
        wash_time INTEGER NOT NULL DEFAULT 0,
        dry_time INTEGER NOT NULL DEFAULT 0,
        total_time INTEGER NOT NULL DEFAULT 0,
        note TEXT DEFAULT '',
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (machine_id) REFERENCES washing_machines(id)
      )
    `)
    console.log('✅ Created washing_history table')

    // Create queue table
    await client.execute(`
      CREATE TABLE queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_number TEXT NOT NULL,
        phone_number TEXT DEFAULT '',
        ip_address TEXT NOT NULL,
        position INTEGER NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Created queue table')

    // Insert sample data
    console.log('📦 Inserting sample data...')
    
    // Create separate washing and drying machines
    await client.execute(`
      INSERT INTO washing_machines (name, type, status) VALUES (?, ?, ?)
    `, ['Máy Giặt', 'washing', 'available'])
    console.log('✅ Created washing machine')
    
    await client.execute(`
      INSERT INTO washing_machines (name, type, status) VALUES (?, ?, ?)
    `, ['Máy Sấy', 'drying', 'available'])
    console.log('✅ Created drying machine')
    
    console.log('✅ Database reset completed!')
    console.log('\n🎉 New database structure:')
    console.log('   🤖 washing_machines - Quản lý máy giặt & sấy (2 máy riêng biệt)')
    console.log('   🏠 rooms - Quản lý phòng đang sử dụng')
    console.log('   📝 washing_history - Lịch sử sử dụng')
    console.log('   🔄 queue - Hàng đợi sử dụng')
    console.log('')
    console.log('   💧 Máy Giặt (type: washing)')
    console.log('   🌪️ Máy Sấy (type: drying)')
    
  } catch (error) {
    console.error('❌ Reset failed:', error)
    throw error
  }
}

// Run reset if called directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('\n🚀 Database reset completed! You can now start your server.')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Reset failed:', error)
      process.exit(1)
    })
}

module.exports = { resetDatabase } 
