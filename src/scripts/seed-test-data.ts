#!/usr/bin/env tsx

import { query } from '../lib/db';

interface TestEmployee {
  firstName: string;
  lastName: string;
  middleInitial?: string;
  otherLastNames?: string;
  email: string;
  phone: string;
  address: string;
  aptNumber?: string;
  city: string;
  state: string;
  zipCode: string;
  dateOfBirth: Date;
  ssn?: string;
  citizenshipStatus: 'us_citizen' | 'noncitizen_national' | 'lawful_permanent_resident' | 'authorized_alien';
  uscisANumber?: string;
  formI94Number?: string;
  foreignPassportNumber?: string;
  status: 'in_progress' | 'completed' | 'needs_correction' | 'data_approved' | 'verified';
  employerNotes?: string;
  createdDaysAgo: number;
  completedDaysAgo?: number;
}

const testEmployees: TestEmployee[] = [
  // IN_PROGRESS (2 forms)
  {
    firstName: 'Maria',
    lastName: 'Rodriguez',
    middleInitial: 'C',
    email: 'maria.rodriguez@email.com',
    phone: '+1-555-0101',
    address: '123 Oak Street',
    aptNumber: '2B',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90210',
    dateOfBirth: new Date('1995-03-15'),
    ssn: '123-45-6789',
    citizenshipStatus: 'lawful_permanent_resident',
    uscisANumber: 'A123456789',
    status: 'in_progress',
    createdDaysAgo: 1
  },
  {
    firstName: 'James',
    lastName: 'Chen',
    email: 'james.chen@email.com',
    phone: '+1-555-0102',
    address: '456 Pine Avenue',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    dateOfBirth: new Date('1988-11-22'),
    citizenshipStatus: 'authorized_alien',
    formI94Number: 'I94123456789',
    foreignPassportNumber: 'C12345678',
    status: 'in_progress',
    createdDaysAgo: 3
  },

  // COMPLETED (3 forms)
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    middleInitial: 'M',
    email: 'sarah.johnson@email.com',
    phone: '+1-555-0103',
    address: '789 Maple Drive',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    dateOfBirth: new Date('1992-07-08'),
    ssn: '987-65-4321',
    citizenshipStatus: 'us_citizen',
    status: 'completed',
    createdDaysAgo: 2,
    completedDaysAgo: 1
  },
  {
    firstName: 'Ahmed',
    lastName: 'Hassan',
    email: 'ahmed.hassan@email.com',
    phone: '+1-555-0104',
    address: '321 Elm Street',
    aptNumber: '15A',
    city: 'Miami',
    state: 'FL',
    zipCode: '33101',
    dateOfBirth: new Date('1985-12-03'),
    citizenshipStatus: 'authorized_alien',
    uscisANumber: 'A987654321',
    formI94Number: 'I94987654321',
    status: 'completed',
    createdDaysAgo: 4,
    completedDaysAgo: 2
  },
  {
    firstName: 'Emily',
    lastName: 'Davis',
    middleInitial: 'R',
    otherLastNames: 'Smith',
    email: 'emily.davis@email.com',
    phone: '+1-555-0105',
    address: '654 Cedar Lane',
    city: 'Baltimore',
    state: 'MD',
    zipCode: '21201',
    dateOfBirth: new Date('1990-09-14'),
    ssn: '456-78-9123',
    citizenshipStatus: 'noncitizen_national',
    status: 'completed',
    createdDaysAgo: 5,
    completedDaysAgo: 3
  },

  // NEEDS_CORRECTION (2 forms)
  {
    firstName: 'Carlos',
    lastName: 'Mendoza',
    middleInitial: 'A',
    email: 'carlos.mendoza@email.com',
    phone: '+1-555-0106',
    address: '987 Birch Road',
    city: 'Phoenix',
    state: 'AZ',
    zipCode: '85001',
    dateOfBirth: new Date('1987-05-25'),
    ssn: '789-12-3456',
    citizenshipStatus: 'lawful_permanent_resident',
    uscisANumber: 'A456789123',
    status: 'needs_correction',
    employerNotes: 'Please verify address details - apartment number appears to be missing and ZIP code format needs correction',
    createdDaysAgo: 7,
    completedDaysAgo: 5
  },
  {
    firstName: 'Lisa',
    lastName: 'Wang',
    email: 'lisa.wang@email.com',
    phone: '+1-555-0107',
    address: '147 Willow Street',
    aptNumber: '8C',
    city: 'Seattle',
    state: 'WA',
    zipCode: '98101',
    dateOfBirth: new Date('1993-01-17'),
    citizenshipStatus: 'authorized_alien',
    formI94Number: 'I94456789123',
    status: 'needs_correction',
    employerNotes: 'SSN format appears incorrect - please provide valid Social Security Number or indicate if not applicable',
    createdDaysAgo: 6,
    completedDaysAgo: 4
  },

  // DATA_APPROVED (2 forms)
  {
    firstName: 'Michael',
    lastName: 'Thompson',
    middleInitial: 'J',
    email: 'michael.thompson@email.com',
    phone: '+1-555-0108',
    address: '258 Spruce Avenue',
    city: 'Denver',
    state: 'CO',
    zipCode: '80201',
    dateOfBirth: new Date('1986-04-12'),
    ssn: '321-54-7890',
    citizenshipStatus: 'us_citizen',
    status: 'data_approved',
    createdDaysAgo: 9,
    completedDaysAgo: 7
  },
  {
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'priya.patel@email.com',
    phone: '+1-555-0109',
    address: '369 Aspen Court',
    aptNumber: '12B',
    city: 'Atlanta',
    state: 'GA',
    zipCode: '30301',
    dateOfBirth: new Date('1991-08-29'),
    citizenshipStatus: 'lawful_permanent_resident',
    uscisANumber: 'A789123456',
    status: 'data_approved',
    createdDaysAgo: 8,
    completedDaysAgo: 6
  },

  // VERIFIED (2 forms)
  {
    firstName: 'David',
    lastName: 'Wilson',
    middleInitial: 'K',
    email: 'david.wilson@email.com',
    phone: '+1-555-0110',
    address: '741 Redwood Drive',
    city: 'Portland',
    state: 'OR',
    zipCode: '97201',
    dateOfBirth: new Date('1984-10-06'),
    ssn: '654-32-1098',
    citizenshipStatus: 'us_citizen',
    status: 'verified',
    createdDaysAgo: 12,
    completedDaysAgo: 10
  },
  {
    firstName: 'Aisha',
    lastName: 'Mohammed',
    middleInitial: 'F',
    email: 'aisha.mohammed@email.com',
    phone: '+1-555-0111',
    address: '852 Cypress Street',
    aptNumber: '5A',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
    dateOfBirth: new Date('1989-12-18'),
    citizenshipStatus: 'authorized_alien',
    uscisANumber: 'A321654987',
    formI94Number: 'I94321654987',
    foreignPassportNumber: 'P87654321',
    status: 'verified',
    createdDaysAgo: 14,
    completedDaysAgo: 12
  },

  // Additional forms for better distribution
  {
    firstName: 'Robert',
    lastName: 'Garcia',
    email: 'robert.garcia@email.com',
    phone: '+1-555-0112',
    address: '963 Palm Boulevard',
    city: 'Las Vegas',
    state: 'NV',
    zipCode: '89101',
    dateOfBirth: new Date('1983-06-21'),
    ssn: '147-25-8369',
    citizenshipStatus: 'noncitizen_national',
    status: 'completed',
    createdDaysAgo: 3,
    completedDaysAgo: 1
  },
  {
    firstName: 'Jennifer',
    lastName: 'Lee',
    middleInitial: 'S',
    otherLastNames: 'Kim',
    email: 'jennifer.lee@email.com',
    phone: '+1-555-0113',
    address: '159 Magnolia Way',
    aptNumber: '7D',
    city: 'Nashville',
    state: 'TN',
    zipCode: '37201',
    dateOfBirth: new Date('1994-02-11'),
    citizenshipStatus: 'lawful_permanent_resident',
    uscisANumber: 'A147258369',
    status: 'data_approved',
    createdDaysAgo: 6,
    completedDaysAgo: 4
  }
];

async function seedTestData() {
  console.log('🌱 Starting to seed test data...');
  
  try {
    // Create employees first
    console.log('👥 Creating employees...');
    
    for (const employee of testEmployees) {
      // Insert employee (minimal info per current schema)
      const employeeResult = await query(`
        INSERT INTO employees (
          email, phone, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4
        )
        ON CONFLICT (phone) DO NOTHING
        RETURNING id
      `, [
        employee.email,
        employee.phone,
        new Date(Date.now() - employee.createdDaysAgo * 24 * 60 * 60 * 1000),
        new Date(Date.now() - employee.createdDaysAgo * 24 * 60 * 60 * 1000)
      ]);

      let employeeId;
      if (employeeResult.rows.length > 0) {
        employeeId = employeeResult.rows[0].id;
        console.log(`✅ Created employee: ${employee.firstName} ${employee.lastName}`);
      } else {
        // Employee already exists, get their ID
        const existingEmployee = await query(`
          SELECT id FROM employees WHERE phone = $1
        `, [employee.phone]);
        employeeId = existingEmployee.rows[0].id;
        console.log(`⚠️  Employee already exists: ${employee.firstName} ${employee.lastName}`);
      }

      // Create I-9 form
      const createdAt = new Date(Date.now() - employee.createdDaysAgo * 24 * 60 * 60 * 1000);
      const completedAt = employee.completedDaysAgo 
        ? new Date(Date.now() - employee.completedDaysAgo * 24 * 60 * 60 * 1000)
        : null;

      await query(`
        INSERT INTO i9_forms (
          employee_id, first_name, last_name, middle_initial, other_last_names,
          address, apt_number, city, state, zip_code, date_of_birth, ssn,
          email, phone, citizenship_status, uscis_a_number, form_i94_number,
          foreign_passport_number, status, employer_notes, completed_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
        )
      `, [
        employeeId,
        employee.firstName,
        employee.lastName,
        employee.middleInitial || null,
        employee.otherLastNames || null,
        employee.address,
        employee.aptNumber || null,
        employee.city,
        employee.state,
        employee.zipCode,
        employee.dateOfBirth,
        employee.ssn || null,
        employee.email,
        employee.phone,
        employee.citizenshipStatus,
        employee.uscisANumber || null,
        employee.formI94Number || null,
        employee.foreignPassportNumber || null,
        employee.status,
        employee.employerNotes || null,
        completedAt,
        createdAt,
        completedAt || createdAt
      ]);

      console.log(`📋 Created I-9 form for ${employee.firstName} ${employee.lastName} (Status: ${employee.status})`);
    }

    // Display summary
    console.log('\n📊 Seeding Summary:');
    const statusCounts = await query(`
      SELECT status, COUNT(*) as count 
      FROM i9_forms 
      GROUP BY status 
      ORDER BY status
    `);

    statusCounts.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count} forms`);
    });

    const citizenshipCounts = await query(`
      SELECT citizenship_status, COUNT(*) as count 
      FROM i9_forms 
      GROUP BY citizenship_status 
      ORDER BY citizenship_status
    `);

    console.log('\n🌍 Citizenship Distribution:');
    citizenshipCounts.rows.forEach(row => {
      console.log(`   ${row.citizenship_status}: ${row.count} forms`);
    });

    console.log('\n✅ Test data seeding completed successfully!');
    console.log('🎯 You can now test all form statuses and workflows in your dashboard.');

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
}

// Run the seeding if this script is called directly
if (require.main === module) {
  seedTestData()
    .then(() => {
      console.log('🎉 Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { seedTestData };