#!/usr/bin/env tsx

import { query } from '../lib/db';

async function cleanDuplicates() {
  try {
    console.log('🧹 Cleaning duplicate I-9 forms...');
    
    // Find and delete duplicate forms, keeping only the most recent one for each employee
    const result = await query(`
      DELETE FROM i9_forms 
      WHERE id NOT IN (
        SELECT DISTINCT ON (employee_id) id 
        FROM i9_forms 
        ORDER BY employee_id, created_at DESC
      )
    `);
    
    console.log(`✅ Deleted ${result.rowCount} duplicate forms`);
    
    // Verify the cleanup
    const countResult = await query('SELECT COUNT(*) as count FROM i9_forms');
    console.log(`📊 Total forms remaining: ${countResult.rows[0].count}`);
    
    // Show status breakdown
    const statusResult = await query(`
      SELECT status, COUNT(*) as count 
      FROM i9_forms 
      GROUP BY status 
      ORDER BY status
    `);
    
    console.log('\n📈 Status breakdown:');
    statusResult.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });
    
  } catch (error) {
    console.error('❌ Error cleaning duplicates:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  cleanDuplicates()
    .then(() => {
      console.log('✨ Cleanup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    });
}

export { cleanDuplicates };