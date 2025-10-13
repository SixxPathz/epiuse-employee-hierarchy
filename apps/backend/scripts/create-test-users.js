require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🔍 Checking existing users...');
    
    const existingUsers = await prisma.user.findMany();
    console.log(`Found ${existingUsers.length} existing users`);
    
    if (existingUsers.length > 0) {
      console.log('Users already exist:');
      existingUsers.forEach(user => {
        console.log(`- ${user.email} (${user.role})`);
      });
      return;
    }
    
    console.log('🔧 Creating test users...');
    
    // Create test users with different roles
    const testUsers = [
      {
        email: 'hr@epiuse.com',
        password: 'password123',
        role: 'HR'
      },
      {
        email: 'admin@epiuse.com',
        password: 'password123',
        role: 'ADMIN'
      },
      {
        email: 'manager@epiuse.com',
        password: 'password123',
        role: 'MANAGER'
      },
      {
        email: 'employee@epiuse.com',
        password: 'password123',
        role: 'EMPLOYEE'
      }
    ];
    
    for (const userData of testUsers) {
      console.log(`Creating user: ${userData.email}`);
      
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          mustChangePassword: false
        }
      });
      
      // Create corresponding employee record
      await prisma.employee.create({
        data: {
          firstName: userData.role,
          lastName: 'User',
          email: userData.email,
          birthDate: new Date('1990-01-01'),
          employeeNumber: `EMP${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          salary: 50000,
          position: `${userData.role} Position`
        }
      });
      
      console.log(`✅ Created ${userData.email} with role ${userData.role}`);
    }
    
    console.log('🎉 Test users created successfully!');
    console.log('\nYou can now login with:');
    console.log('HR: hr@epiuse.com / password123');
    console.log('Admin: admin@epiuse.com / password123');
    console.log('Manager: manager@epiuse.com / password123');
    console.log('Employee: employee@epiuse.com / password123');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();