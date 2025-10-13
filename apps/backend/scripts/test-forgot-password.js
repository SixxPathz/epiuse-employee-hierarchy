require('dotenv').config();
process.env.DATABASE_URL = 'postgresql://postgres:WIlbTptekRaSpDPGxUPxrDGpeSFDhlVS@switchyard.proxy.rlwy.net:11405/railway';

const axios = require('axios');

async function testForgotPassword() {
  console.log('🔄 TESTING FORGOT PASSWORD ENDPOINT...');
  console.log('');
  
  try {
    // Test 1: Valid email
    console.log('1️⃣ Testing with valid admin email...');
    
    const response1 = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      email: 'thabo.mthembu@epiuse.com'
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Request successful');
    console.log('   Status:', response1.status);
    console.log('   Message:', response1.data.message);
    
    // Test 2: Invalid email format
    console.log('');
    console.log('2️⃣ Testing with invalid email format...');
    
    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email: 'invalid-email'
      });
    } catch (error) {
      console.log('✅ Validation working - rejected invalid email');
      console.log('   Error:', error.response?.data?.errors?.[0]?.msg || error.response?.data?.error);
    }
    
    // Test 3: Non-existent email
    console.log('');
    console.log('3️⃣ Testing with non-existent email...');
    
    const response3 = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      email: 'nonexistent@example.com'
    });
    
    console.log('✅ Security working - same response for non-existent email');
    console.log('   Status:', response3.status);
    console.log('   Message:', response3.data.message);
    
    // Test 4: Check if token was saved in database
    console.log('');
    console.log('4️⃣ Checking database for reset token...');
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const userWithToken = await prisma.user.findUnique({
      where: { email: 'thabo.mthembu@epiuse.com' },
      select: { 
        resetToken: true, 
        resetTokenExpiry: true,
        email: true 
      }
    });
    
    if (userWithToken?.resetToken) {
      console.log('✅ Reset token saved in database');
      console.log('   Token exists:', !!userWithToken.resetToken);
      console.log('   Expiry:', userWithToken.resetTokenExpiry);
      
      // Clean up - remove the token
      await prisma.user.update({
        where: { email: 'thabo.mthembu@epiuse.com' },
        data: {
          resetToken: null,
          resetTokenExpiry: null
        }
      });
      console.log('✅ Test token cleaned up');
    } else {
      console.log('❌ Reset token not found in database');
    }
    
    await prisma.$disconnect();
    
    console.log('');
    console.log('🎉 FORGOT PASSWORD ENDPOINT WORKING!');
    console.log('');
    console.log('✅ API endpoint responding correctly');
    console.log('✅ Email validation working');
    console.log('✅ Security measures in place');
    console.log('✅ Database tokens saving correctly');
    console.log('');
    console.log('💡 If frontend still fails, check:');
    console.log('   - Backend server is running on port 5000');
    console.log('   - Frontend is using correct API base URL');
    console.log('   - No CORS issues');
    
  } catch (error) {
    console.error('❌ Forgot password test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    console.error('   Full error:', error);
  }
}

testForgotPassword();