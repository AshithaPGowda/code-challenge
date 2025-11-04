import { query } from '../lib/db';
import fs from 'fs';
import path from 'path';

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../lib/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Schema file loaded successfully');
    
    // Execute the schema
    await query(schema);
    
    console.log('✅ Database schema created successfully!');
    console.log('📋 Tables created:');
    console.log('   - employees');
    console.log('   - i9_forms');
    console.log('🔗 Indexes and triggers applied');
    
  } catch (error) {
    console.error('❌ Database initialization failed:');
    console.error(error);
    process.exit(1);
  } finally {
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the initialization
initializeDatabase();