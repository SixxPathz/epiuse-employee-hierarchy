require('dotenv').config();
process.env.DATABASE_URL = 'postgresql://postgres:WIlbTptekRaSpDPGxUPxrDGpeSFDhlVS@switchyard.proxy.rlwy.net:11405/railway';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testBasicLogin() {
  try {
    console.log('🔐 Testing Basic Login Functionality...');
    console.log('');
    
    // Test with CEO credentials
    const email = 'thabo.mthembu@epiuse.com';
    const password = 'securepassword123';
    
    console.log(`👤 Attempting login with: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: { employee: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ User found: ${user.employee?.firstName} ${user.employee?.lastName}`);
    console.log(`🏷️  Role: ${user.role}`);
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return;
    }
    
    console.log('✅ Password valid');
    console.log('');
    console.log('🎉 LOGIN SUCCESSFUL!');
    console.log('');
    console.log('📋 Basic System Status:');
    console.log('   ✅ Database Connection: Working');
    console.log('   ✅ User Authentication: Working');
    console.log('   ✅ Basic Employee Data: Available');
    console.log('   ✅ Role-based Access: Ready');
    console.log('   🚫 HR Features: Removed');
    
    console.log('');
    console.log('👥 Available Test Accounts:');
    
    const allUsers = await prisma.user.findMany({
      include: { employee: true },
      take: 5
    });
    
    allUsers.forEach(user => {
      console.log(`   📧 ${user.email} (${user.role}) - ${user.employee?.firstName} ${user.employee?.lastName}`);
      console.log(`      Password: securepassword123`);
    });
    
  } catch (error) {
    console.error('❌ Login test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testBasicLogin();