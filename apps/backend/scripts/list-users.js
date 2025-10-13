require('dotenv').config();
process.env.DATABASE_URL = 'postgresql://postgres:WIlbTptekRaSpDPGxUPxrDGpeSFDhlVS@switchyard.proxy.rlwy.net:11405/railway';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        mustChangePassword: true
      }
    });
    
    console.log('📋 Existing users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role}) - Must change password: ${user.mustChangePassword}`);
    });
    
  } catch (error) {
    console.error('❌ Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();