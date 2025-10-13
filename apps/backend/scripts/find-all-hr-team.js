require('dotenv').config();
process.env.DATABASE_URL = 'postgresql://postgres:WIlbTptekRaSpDPGxUPxrDGpeSFDhlVS@switchyard.proxy.rlwy.net:11405/railway';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findAllHRTeam() {
  try {
    console.log('🔍 Looking for ALL HR team members (including recruiter)...');
    
    // Find employees with HR-related positions (expanded search)
    const hrEmployees = await prisma.employee.findMany({
      where: {
        OR: [
          { position: { contains: 'HR', mode: 'insensitive' } },
          { position: { contains: 'Human Resources', mode: 'insensitive' } },
          { position: { contains: 'Human Resource', mode: 'insensitive' } },
          { position: { contains: 'People', mode: 'insensitive' } },
          { position: { contains: 'Recruitment', mode: 'insensitive' } },
          { position: { contains: 'Recruiter', mode: 'insensitive' } },
          { position: { contains: 'Talent', mode: 'insensitive' } },
          { position: { contains: 'Hiring', mode: 'insensitive' } },
          { position: { contains: 'Staffing', mode: 'insensitive' } }
        ]
      }
    });
    
    // Get corresponding users
    const hrEmails = hrEmployees.map(emp => emp.email);
    const hrUsers = await prisma.user.findMany({
      where: {
        email: { in: hrEmails }
      }
    });
    
    console.log(`\n📋 Found ${hrEmployees.length} HR team members:`);
    
    hrEmployees.forEach((employee, index) => {
      const user = hrUsers.find(u => u.email === employee.email);
      console.log(`${index + 1}. ${employee.firstName} ${employee.lastName}`);
      console.log(`   📧 Email: ${employee.email}`);
      console.log(`   💼 Position: ${employee.position}`);
      console.log(`   👤 Current Role: ${user?.role || 'No user account'}`);
      console.log('');
    });
    
    return hrEmployees;
    
  } catch (error) {
    console.error('❌ Error finding HR team:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findAllHRTeam();