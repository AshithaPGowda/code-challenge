import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
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
    const totalForms = countResult.rows[0].count;
    
    // Show status breakdown
    const statusResult = await query(`
      SELECT status, COUNT(*) as count 
      FROM i9_forms 
      GROUP BY status 
      ORDER BY status
    `);
    
    return NextResponse.json({
      success: true,
      deletedCount: result.rowCount,
      totalRemaining: totalForms,
      statusBreakdown: statusResult.rows
    });
    
  } catch (error) {
    console.error('❌ Error cleaning duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to clean duplicates' },
      { status: 500 }
    );
  }
}