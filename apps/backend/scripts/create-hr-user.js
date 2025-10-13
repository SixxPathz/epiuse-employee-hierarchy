require('dotenv').config();
process.env.DATABASE_URL = 'postgresql://postgres:WIlbTptekRaSpDPGxUPxrDGpeSFDhlVS@switchyard.proxy.rlwy.net:11405/railway';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createHRUser() {
  try {
    console.log('🔧 Creating HR test user...');
    
    // Check if HR user already exists
    const existingHR = await prisma.user.findFirst({
      where: { role: 'HR' }
    });
    
    if (existingHR) {
      console.log('✅ HR user already exists:', existingHR.email);
      return;
    }
    
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Create HR user and employee
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: 'hr@epiuse.com',
          password: hashedPassword,
          role: 'HR',
          mustChangePassword: false
        }
      });

      // Create employee
      const employee = await tx.employee.create({
        data: {
          firstName: 'HR',
          lastName: 'Manager',
          email: 'hr@epiuse.com',
          employeeNumber: 'HR001',
          position: 'HR Manager',
          birthDate: new Date('1985-01-01'),
          salary: 75000
        }
      });

      return { user, employee };
    });
    
    console.log('✅ HR user created successfully!');
    console.log('📧 Email: hr@epiuse.com');
    console.log('🔑 Password: password123');
    console.log('👤 Role: HR');
    
  } catch (error) {
    console.error('❌ Error creating HR user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createHRUser();