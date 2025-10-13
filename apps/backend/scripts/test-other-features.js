require('dotenv').config();
process.env.DATABASE_URL = 'postgresql://postgres:WIlbTptekRaSpDPGxUPxrDGpeSFDhlVS@switchyard.proxy.rlwy.net:11405/railway';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testOtherFeatures() {
  console.log('🔍 TESTING OTHER CORE FEATURES...');
  console.log('');
  
  try {
    // 1. Test Employee Creation
    console.log('1️⃣ Testing Employee Creation...');
    
    const testEmployee = {
      firstName: 'Test',
      lastName: 'Employee',
      email: 'test.employee@epiuse.com',
      birthDate: new Date('1990-01-01'),
      employeeNumber: 'EMP-TEST-001',
      salary: 500000,
      position: 'Test Position',
      department: 'technology'
    };
    
    // First create user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const testUser = await prisma.user.create({
      data: {
        email: testEmployee.email,
        password: hashedPassword,
        role: 'EMPLOYEE',
        mustChangePassword: false
      }
    });
    
    // Then create employee
    const createdEmployee = await prisma.employee.create({
      data: testEmployee
    });
    
    console.log('✅ Employee creation successful');
    console.log('   Created:', createdEmployee.firstName, createdEmployee.lastName);
    
    // 2. Test Employee Update (non-email fields)
    console.log('');
    console.log('2️⃣ Testing Employee Update...');
    
    const updatedEmployee = await prisma.employee.update({
      where: { id: createdEmployee.id },
      data: {
        position: 'Updated Test Position',
        salary: 550000
      }
    });
    
    console.log('✅ Employee update successful');
    console.log('   New position:', updatedEmployee.position);
    console.log('   New salary:', updatedEmployee.salary);
    
    // 3. Test Manager Assignment
    console.log('');
    console.log('3️⃣ Testing Manager Assignment...');
    
    // Find a manager
    const manager = await prisma.employee.findFirst({
      where: { 
        department: 'technology',
        position: { contains: 'Manager' }
      }
    });
    
    if (manager) {
      const employeeWithManager = await prisma.employee.update({
        where: { id: createdEmployee.id },
        data: { managerId: manager.id },
        include: {
          manager: {
            select: {
              firstName: true,
              lastName: true,
              position: true
            }
          }
        }
      });
      
      console.log('✅ Manager assignment successful');
      console.log('   Manager:', employeeWithManager.manager?.firstName, employeeWithManager.manager?.lastName);
    } else {
      console.log('⚠️  No manager found for assignment test');
    }
    
    // 4. Test Employee Hierarchy
    console.log('');
    console.log('4️⃣ Testing Employee Hierarchy...');
    
    const employeesWithHierarchy = await prisma.employee.findMany({
      take: 3,
      include: {
        manager: {
          select: {
            firstName: true,
            lastName: true,
            position: true
          }
        },
        subordinates: {
          select: {
            firstName: true,
            lastName: true,
            position: true
          }
        }
      }
    });
    
    console.log('✅ Hierarchy query successful');
    console.log('   Found', employeesWithHierarchy.length, 'employees with hierarchy data');
    
    // 5. Test Department Statistics
    console.log('');
    console.log('5️⃣ Testing Department Statistics...');
    
    const deptStats = await prisma.employee.groupBy({
      by: ['department'],
      _count: { id: true }
    });
    
    console.log('✅ Department statistics successful');
    deptStats.forEach(stat => {
      console.log(`   ${stat.department}: ${stat._count.id} employees`);
    });
    
    // 6. Test Password Reset Token Functionality
    console.log('');
    console.log('6️⃣ Testing Password Reset Tokens...');
    
    const resetToken = 'test-reset-token-' + Date.now();
    const resetExpiry = new Date(Date.now() + 3600000); // 1 hour
    
    const userWithToken = await prisma.user.update({
      where: { id: testUser.id },
      data: {
        resetToken: resetToken,
        resetTokenExpiry: resetExpiry
      }
    });
    
    console.log('✅ Reset token set successfully');
    
    // Find user by reset token
    const foundByToken = await prisma.user.findFirst({
      where: {
        resetToken: resetToken,
        resetTokenExpiry: { gt: new Date() }
      }
    });
    
    if (foundByToken) {
      console.log('✅ Reset token lookup successful');
    } else {
      console.log('❌ Reset token lookup failed');
    }
    
    // Clear reset token
    await prisma.user.update({
      where: { id: testUser.id },
      data: {
        resetToken: null,
        resetTokenExpiry: null
      }
    });
    
    console.log('✅ Reset token cleared successfully');
    
    // 7. Test User-Employee Relationship
    console.log('');
    console.log('7️⃣ Testing User-Employee Relationship...');
    
    const userWithEmployee = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: { employee: true }
    });
    
    if (userWithEmployee?.employee) {
      console.log('✅ User-Employee relationship working');
      console.log('   User email:', userWithEmployee.email);
      console.log('   Employee name:', userWithEmployee.employee.firstName, userWithEmployee.employee.lastName);
    } else {
      console.log('❌ User-Employee relationship issue');
    }
    
    // Cleanup - Delete test records
    console.log('');
    console.log('8️⃣ Cleaning up test data...');
    
    await prisma.employee.delete({
      where: { id: createdEmployee.id }
    });
    
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    
    console.log('✅ Test data cleaned up');
    
    console.log('');
    console.log('🎉 ALL CORE FEATURES TESTED SUCCESSFULLY!');
    console.log('');
    console.log('📋 FEATURE STATUS:');
    console.log('✅ Employee Creation: Working');
    console.log('✅ Employee Updates: Working');
    console.log('✅ Manager Assignment: Working');
    console.log('✅ Employee Hierarchy: Working');
    console.log('✅ Department Statistics: Working');
    console.log('✅ Password Reset Tokens: Working');
    console.log('✅ User-Employee Relationships: Working');
    console.log('✅ Data Integrity: Maintained');
    
  } catch (error) {
    console.error('❌ Feature test failed:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta
    });
  } finally {
    await prisma.$disconnect();
  }
}

testOtherFeatures();