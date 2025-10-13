#!/usr/bin/env node

/**
 * Quick Deployment Fix Script
 * This script helps you update the placeholder URLs with your actual deployment URLs
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function fixDeployment() {
  console.log('🚀 EPI-USE Deployment Fix Script\n');
  
  // Get Railway URL
  const railwayUrl = await question('Enter your Railway backend URL (e.g., https://epiuse-backend-production-abc123.up.railway.app): ');
  
  // Get Netlify URL
  const netlifyUrl = await question('Enter your Netlify frontend URL (e.g., https://amazing-site-name.netlify.app): ');
  
  if (!railwayUrl || !netlifyUrl) {
    console.log('❌ Both URLs are required. Exiting...');
    process.exit(1);
  }
  
  console.log('\n🔧 Updating configuration files...\n');
  
  // Update netlify.toml
  try {
    const netlifyConfig = fs.readFileSync('netlify.toml', 'utf8');
    const updatedNetlifyConfig = netlifyConfig.replace(
      /your-actual-railway-url/g, 
      railwayUrl.replace('https://', '').replace('http://', '')
    );
    fs.writeFileSync('netlify.toml', updatedNetlifyConfig);
    console.log('✅ Updated netlify.toml');
  } catch (error) {
    console.log('❌ Error updating netlify.toml:', error.message);
  }
  
  // Update _redirects file
  try {
    const redirectsPath = 'apps/frontend/public/_redirects';
    const redirectsContent = fs.readFileSync(redirectsPath, 'utf8');
    const updatedRedirects = redirectsContent.replace(
      /your-actual-railway-url/g, 
      railwayUrl.replace('https://', '').replace('http://', '')
    );
    fs.writeFileSync(redirectsPath, updatedRedirects);
    console.log('✅ Updated _redirects file');
  } catch (error) {
    console.log('❌ Error updating _redirects:', error.message);
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. Set environment variables in Netlify:');
  console.log(`   NEXT_PUBLIC_API_URL = ${railwayUrl}`);
  console.log(`   NEXTAUTH_URL = ${netlifyUrl}`);
  console.log(`   NEXTAUTH_SECRET = 9f4a7c2e6b1d8f3a5c0e7d9b2a6f4c1e8d3b7a0f5c9e2d1b6a8f3c0e7d4b1a9f2`);
  console.log('');
  console.log('2. Set environment variables in Railway:');
  console.log(`   FRONTEND_URL = ${netlifyUrl}`);
  console.log('');
  console.log('3. Seed the production database:');
  console.log(`   curl -X POST ${railwayUrl}/api/admin/seed-production \\`);
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -H "x-seed-secret: epiuse-seed-2025" \\');
  console.log('     -d \'{}\'');
  console.log('');
  console.log('4. Commit and push changes:');
  console.log('   git add .');
  console.log('   git commit -m "Fix deployment URLs"');
  console.log('   git push origin main');
  console.log('');
  console.log('5. Test login with these credentials:');
  console.log('   Admin: thabo.mthembu@epiuse.com / securepassword123');
  console.log('   Manager: sipho.ngcobo@epiuse.com / securepassword123');
  console.log('   Employee: kagiso.morake@epiuse.com / securepassword123');
  console.log('\n🎉 Your deployment should now work!');
  
  rl.close();
}

fixDeployment().catch(console.error);
