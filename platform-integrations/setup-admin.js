require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db/config');

async function setupAdmin() {
  try {
    const email = 'admin@leadgenlite.com';
    const password = 'admin123'; // Change this!
    const passwordHash = bcrypt.hashSync(password, 10);
    
    await pool.query(`
      UPDATE organizations 
      SET email = $1, password_hash = $2 
      WHERE id = (SELECT id FROM organizations LIMIT 1)
    `, [email, passwordHash]);
    
    console.log('✅ Admin credentials updated!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('\n🚀 Login at: http://localhost:3000/admin/login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupAdmin();
