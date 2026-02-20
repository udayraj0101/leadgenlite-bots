require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db/config');
const fs = require('fs');
const path = require('path');

async function setup() {
  try {
    console.log('🔧 Running database migration...');
    
    // Run migration
    const migration = fs.readFileSync(path.join(__dirname, 'db/add-admin-columns.sql'), 'utf8');
    await pool.query(migration);
    console.log('✅ Migration complete');
    
    // Setup admin credentials
    const email = 'admin@leadgenlite.com';
    const password = 'admin123';
    const passwordHash = bcrypt.hashSync(password, 10);
    
    await pool.query(`
      UPDATE organizations 
      SET email = $1, password_hash = $2 
      WHERE id = (SELECT id FROM organizations LIMIT 1)
    `, [email, passwordHash]);
    
    console.log('\n✅ Admin credentials created!');
    console.log('━'.repeat(50));
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('━'.repeat(50));
    console.log('\n🚀 Login at: http://localhost:3000/admin/login\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setup();
