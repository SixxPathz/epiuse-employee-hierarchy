import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const seedDatabase = async () => {
  console.log('🌱 Starting Railway database seed...');

  try {
    // Check if data already exists
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      console.log('⚠️ Database already has users. Skipping seed to avoid duplicates.');
      return { success: true, message: 'Database already seeded', userCount: existingUsers };
    }

    // Create CEO
    const hashedPassword = await bcrypt.hash('securepassword123', 10);
    
    const ceoUser = await prisma.user.create({
      data: {
        email: 'thabo.mthembu@epiuse.com',
        password: hashedPassword,
        role: 'ADMIN',
        mustChangePassword: false,
      },
    });

    const ceo = await prisma.employee.create({
      data: {
        employeeNumber: 'EMP-001',
        firstName: 'Thabo',
        lastName: 'Mthembu',
        email: 'thabo.mthembu@epiuse.com',
        position: 'Chief Executive Officer',
        department: 'management',
        salary: 4500000,
        birthDate: new Date('1975-05-15'),
      },
    });

    // Create a simple admin user for testing
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@epiuse.com',
        password: hashedPassword,
        role: 'ADMIN',
        mustChangePassword: false,
      },
    });

    const adminEmployee = await prisma.employee.create({
      data: {
        employeeNumber: 'EMP-ADMIN',
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@epiuse.com',
        position: 'System Administrator',
        department: 'management',
        salary: 1500000,
        birthDate: new Date('1990-01-01'),
      },
    });

    // Create a few department heads
    const techHeadUser = await prisma.user.create({
      data: {
        email: 'sipho.ngcobo@epiuse.com',
        password: hashedPassword,
        role: 'MANAGER',
        mustChangePassword: false,
      },
    });

    const techHead = await prisma.employee.create({
      data: {
        employeeNumber: 'EMP-002',
        firstName: 'Sipho',
        lastName: 'Ngcobo',
        email: 'sipho.ngcobo@epiuse.com',
        position: 'Head of Technology',
        department: 'technology',
        salary: 2100000,
        birthDate: new Date('1980-03-01'),
        managerId: ceo.id,
      },
    });

    // Create some employees
    const devUser = await prisma.user.create({
      data: {
        email: 'kagiso.morake@epiuse.com',
        password: hashedPassword,
        role: 'EMPLOYEE',
        mustChangePassword: false,
      },
    });

    const developer = await prisma.employee.create({
      data: {
        employeeNumber: 'EMP-006',
        firstName: 'Kagiso',
        lastName: 'Morake',
        email: 'kagiso.morake@epiuse.com',
        position: 'Senior Software Engineer',
        department: 'technology',
        salary: 1200000,
        birthDate: new Date('1990-06-15'),
        managerId: techHead.id,
      },
    });

    const finalCount = await prisma.user.count();
    console.log('✅ Railway database seeded successfully!');
    console.log(`Created ${finalCount} users and ${await prisma.employee.count()} employees`);
    
    return { 
      success: true, 
      message: 'Database seeded successfully',
      userCount: finalCount,
      employees: await prisma.employee.count(),
      testCredentials: {
        admin: 'admin@epiuse.com',
        ceo: 'thabo.mthembu@epiuse.com',
        manager: 'sipho.ngcobo@epiuse.com',
        employee: 'kagiso.morake@epiuse.com',
        password: 'securepassword123'
      }
    };

  } catch (error) {
    console.error('❌ Error seeding Railway database:', error);
    throw error;
  }
};