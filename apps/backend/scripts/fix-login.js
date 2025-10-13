require('dotenv').config();
process.env.DATABASE_URL = 'postgresql://postgres:WIlbTptekRaSpDPGxUPxrDGpeSFDhlVS@switchyard.proxy.rlwy.net:11405/railway';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixLogin() {
  try {
    console.log('🔧 Fixing login credentials...');
    
    // Reset password for CEO/Admin user
    const hashedPassword = await bcrypt.hash('securepassword123', 10);
    
    const adminUser = await prisma.user.update({
      where: { email: 'thabo.mthembu@epiuse.com' },
      data: { 
        password: hashedPassword,
        mustChangePassword: false
      }
    });
    
    console.log('✅ Reset password for CEO: thabo.mthembu@epiuse.com');
    console.log('   Password: securepassword123');
    
    // Also reset a few other users for testing
    const testUsers = [
      'sipho.ngcobo@epiuse.com', // Tech Manager
      'nomsa.dlamini@epiuse.com', // HR Manager  
      'andre.vandermerwe@epiuse.com' // Sales Manager
    ];
    
    for (const email of testUsers) {
      await prisma.user.update({
        where: { email },
        data: { 
          password: hashedPassword,
          mustChangePassword: false
        }
      });
      console.log(`✅ Reset password for ${email}`);
    }
    
    console.log('\n🎉 Login credentials fixed!');
    console.log('\nYou can now login with:');
    console.log('CEO/Admin: thabo.mthembu@epiuse.com / securepassword123');
    console.log('Tech Manager: sipho.ngcobo@epiuse.com / securepassword123');
    console.log('HR Manager: nomsa.dlamini@epiuse.com / securepassword123');
    console.log('Sales Manager: andre.vandermerwe@epiuse.com / securepassword123');
    
  } catch (error) {
    console.error('❌ Error fixing login:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLogin();