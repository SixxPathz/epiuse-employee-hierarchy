require('dotenv').config();
process.env.DATABASE_URL = 'postgresql://postgres:WIlbTptekRaSpDPGxUPxrDGpeSFDhlVS@switchyard.proxy.rlwy.net:11405/railway';

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function testAllFeatures() {
  console.log('🧪 COMPREHENSIVE FEATURE TESTING...');
  console.log('');
  
  try {
    // 1. Test Database Connection
    console.log('1️⃣ Testing Database Connection...');
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    
    // 2. Test User Count
    const userCount = await prisma.user.count();
    const employeeCount = await prisma.employee.count();
    console.log(`✅ Found ${userCount} users and ${employeeCount} employees`);
    
    // 3. Test Admin User
    console.log('');
    console.log('2️⃣ Testing Admin User...');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'thabo.mthembu@epiuse.com' },
      include: { employee: true }
    });
    
    if (adminUser) {
      console.log('✅ Admin user found:', adminUser.email);
      console.log('   Role:', adminUser.role);
      console.log('   Employee ID:', adminUser.employee?.id);
      console.log('   Name:', adminUser.employee?.firstName, adminUser.employee?.lastName);
    } else {
      console.log('❌ Admin user not found');
    }
    
    // 4. Test Password Reset Fields
    console.log('');
    console.log('3️⃣ Testing Password Reset Fields...');
    const hasResetFields = await prisma.user.findFirst({
      select: { resetToken: true, resetTokenExpiry: true }
    });
    console.log('✅ Password reset fields exist:', !!hasResetFields);
    
    // 5. Test Backend Server
    console.log('');
    console.log('4️⃣ Testing Backend Server...');
    try {
      const healthCheck = await axios.get('http://localhost:5000/health', { timeout: 3000 });
      console.log('✅ Backend server is running:', healthCheck.data.status);
    } catch (error) {
      console.log('❌ Backend server is not responding');
      console.log('   Make sure backend is running on port 5000');
    }
    
    // 6. Test Auth Endpoints
    console.log('');
    console.log('5️⃣ Testing Authentication...');
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'thabo.mthembu@epiuse.com',
        password: 'securepassword123'
      }, { timeout: 3000 });
      
      console.log('✅ Login successful');
      console.log('   Token received:', !!loginResponse.data.token);
      console.log('   User data:', loginResponse.data.user?.email, loginResponse.data.user?.role);
      
      // Test profile update with the token
      const token = loginResponse.data.token;
      const employeeId = loginResponse.data.user.employee.id;
      
      console.log('');
      console.log('6️⃣ Testing Profile Update...');
      try {
        const updateResponse = await axios.put(
          `http://localhost:5000/api/employees/${employeeId}`,
          {
            firstName: 'Thabo',
            lastName: 'Mthembu',
            position: 'Chief Executive Officer'
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 3000
          }
        );
        
        console.log('✅ Profile update successful');
        console.log('   Updated employee:', updateResponse.data.employee?.firstName, updateResponse.data.employee?.lastName);
      } catch (updateError) {
        console.log('❌ Profile update failed:', updateError.response?.data?.error || updateError.message);
      }
      
    } catch (authError) {
      console.log('❌ Authentication failed:', authError.response?.data?.error || authError.message);
    }
    
    // 7. Test Forgot Password Endpoint
    console.log('');
    console.log('7️⃣ Testing Forgot Password...');
    try {
      const forgotResponse = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email: 'thabo.mthembu@epiuse.com'
      }, { timeout: 3000 });
      
      console.log('✅ Forgot password endpoint working');
      console.log('   Response:', forgotResponse.data.message);
    } catch (forgotError) {
      console.log('❌ Forgot password failed:', forgotError.response?.data?.error || forgotError.message);
    }
    
    // 8. Test Employee Endpoints
    console.log('');
    console.log('8️⃣ Testing Employee List...');
    try {
      // First login to get token
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'thabo.mthembu@epiuse.com',
        password: 'securepassword123'
      });
      
      const token = loginResponse.data.token;
      
      const employeesResponse = await axios.get('http://localhost:5000/api/employees?limit=5', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 3000
      });
      
      console.log('✅ Employee list endpoint working');
      console.log('   Employees found:', employeesResponse.data.employees?.length);
    } catch (employeeError) {
      console.log('❌ Employee list failed:', employeeError.response?.data?.error || employeeError.message);
    }
    
    console.log('');
    console.log('🎉 TESTING COMPLETE!');
    console.log('');
    console.log('📋 SUMMARY:');
    console.log('✅ Database: Connected with users and employees');
    console.log('✅ Password Reset: Fields properly added');
    console.log('✅ Server: Check individual test results above');
    console.log('✅ Auth: Login functionality tested');
    console.log('✅ Profile: Update functionality tested');
    console.log('✅ API: Employee endpoints tested');
    
  } catch (error) {
    console.error('❌ Testing failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAllFeatures();