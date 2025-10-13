require('dotenv').config();
process.env.DATABASE_URL = 'postgresql://postgres:WIlbTptekRaSpDPGxUPxrDGpeSFDhlVS@switchyard.proxy.rlwy.net:11405/railway';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetHRPasswords() {
  try {
    console.log('🔧 Resetting HR department passwords to "password123"...');
    
    const hrEmails = [
      'nomsa.dlamini@epiuse.com',    // Head of Human Resources
      'thandiwe.zulu@epiuse.com',   // HR Specialist
      'ethan.kruger@epiuse.com'     // HR Assistant
    ];
    
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    for (const email of hrEmails) {
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (user) {
        await prisma.user.update({
          where: { email },
          data: { 
            password: hashedPassword,
            mustChangePassword: false
          }
        });
        
        console.log(`✅ Reset password for ${email}`);
      } else {
        console.log(`⚠️  No user account found for ${email}`);
      }
    }
    
    console.log('\n🎉 HR passwords reset successfully!');
    console.log('\n🔐 Login Credentials for HR Team:');
    console.log('─'.repeat(50));
    console.log('📧 nomsa.dlamini@epiuse.com');
    console.log('👤 Role: HR (Head of Human Resources)');
    console.log('🔑 Password: password123');
    console.log('');
    console.log('📧 thandiwe.zulu@epiuse.com');
    console.log('👤 Role: HR (HR Specialist)');
    console.log('🔑 Password: password123');
    console.log('');
    console.log('📧 ethan.kruger@epiuse.com');
    console.log('👤 Role: HR (HR Assistant)');
    console.log('🔑 Password: password123');
    console.log('─'.repeat(50));
    
  } catch (error) {
    console.error('❌ Error resetting HR passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetHRPasswords();