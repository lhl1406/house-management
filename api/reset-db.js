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
    const tables = ['room_machine_usage', 'washing_history', 'queue', 'washing_machines', 'rooms']
    
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
    
    // Create washing_machines table - Máy giặt và máy sấy riêng biệt
    await client.execute(`
      CREATE TABLE washing_machines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('washing', 'drying')),
        status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'in_use', 'maintenance')),
        current_room_number TEXT DEFAULT '',
        current_user_ip TEXT DEFAULT '',
        current_note TEXT DEFAULT '',
        start_time DATETIME,
        estimated_end_time DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Created washing_machines table')

    // Create rooms table - Lưu thông tin phòng và IP
    await client.execute(`
      CREATE TABLE rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_number TEXT NOT NULL UNIQUE,
        phone_number TEXT DEFAULT '',
        ip_address TEXT NOT NULL UNIQUE,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Created rooms table')

    // Create room_machine_usage table - Theo dõi phòng đang sử dụng máy nào
    await client.execute(`
      CREATE TABLE room_machine_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_number TEXT NOT NULL,
        machine_id INTEGER NOT NULL,
        ip_address TEXT NOT NULL,
        phone_number TEXT DEFAULT '',
        start_time DATETIME NOT NULL,
        estimated_end_time DATETIME NOT NULL,
        actual_end_time DATETIME,
        notes TEXT DEFAULT '',
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (machine_id) REFERENCES washing_machines(id),
        FOREIGN KEY (room_number) REFERENCES rooms(room_number)
      )
    `)
    console.log('✅ Created room_machine_usage table')

    // Create washing_history table - Lịch sử sử dụng chi tiết
    await client.execute(`
      CREATE TABLE washing_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id INTEGER NOT NULL,
        machine_type TEXT NOT NULL,
        machine_name TEXT NOT NULL,
        room_number TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 0,
        notes TEXT DEFAULT '',
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (machine_id) REFERENCES washing_machines(id)
      )
    `)
    console.log('✅ Created washing_history table')

    // Create queue table - Hàng đợi cho từng loại máy
    await client.execute(`
      CREATE TABLE queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_number TEXT NOT NULL,
        phone_number TEXT DEFAULT '',
        ip_address TEXT NOT NULL,
        machine_type TEXT NOT NULL CHECK(machine_type IN ('washing', 'drying', 'any')),
        position INTEGER NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Created queue table')

    // Insert sample data
    console.log('📦 Inserting sample data...')
    
    // Tạo máy giặt
    await client.execute(`
      INSERT INTO washing_machines (name, type, status) VALUES (?, ?, ?)
    `, ['Máy Giặt 1', 'washing', 'available'])
    console.log('✅ Created washing machine 1')
    
    // Tạo máy sấy
    await client.execute(`
      INSERT INTO washing_machines (name, type, status) VALUES (?, ?, ?)
    `, ['Máy Sấy 1', 'drying', 'available'])
    console.log('✅ Created drying machine 1')
    
    // Tạo một số phòng mẫu
    await client.execute(`
      INSERT INTO rooms (room_number, phone_number, ip_address) VALUES (?, ?, ?)
    `, ['101', '0123456789', '192.168.1.101'])
    console.log('✅ Created sample room 101')
    
    await client.execute(`
      INSERT INTO rooms (room_number, phone_number, ip_address) VALUES (?, ?, ?)
    `, ['102', '0987654321', '192.168.1.102'])
    console.log('✅ Created sample room 102')
    
    console.log('✅ Database reset completed!')
    console.log('\n🎉 New database structure:')
    console.log('   🤖 washing_machines - Quản lý máy giặt & sấy (2 máy riêng biệt)')
    console.log('      • 1 máy giặt (type: washing)')
    console.log('      • 1 máy sấy (type: drying)')
    console.log('   🏠 rooms - Phòng với IP riêng biệt (1 phòng 1 IP)')
    console.log('   🔄 room_machine_usage - Theo dõi phòng sử dụng máy nào')
    console.log('   📝 washing_history - Lịch sử chi tiết')
    console.log('   📋 queue - Hàng đợi theo loại máy')
    console.log('')
    console.log('   💧 Máy Giặt 1 & 2 (type: washing)')
    console.log('   🌪️ Máy Sấy 1 & 2 (type: drying)')
    console.log('   🏠 Phòng 101 & 102 (sample data)')
    console.log('')
    console.log('✨ Tính năng mới:')
    console.log('   • 1 phòng có thể dùng nhiều máy cùng lúc')
    console.log('   • Hàng đợi riêng cho máy giặt và máy sấy')
    console.log('   • Lịch sử chi tiết với thời gian sử dụng')
    console.log('   • Quản lý IP để đảm bảo 1 phòng 1 IP')
    
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
