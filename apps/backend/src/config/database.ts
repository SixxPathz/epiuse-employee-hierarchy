/**
 * PERMANENT DATABASE CONFIGURATION
 * This file ensures Railway PostgreSQL is used exclusively
 * and prevents any interference from system environment variables
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Force load environment from .env file ONLY
const loadRailwayConfig = () => {
  const envPath = path.resolve(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    throw new Error('❌ .env file not found. Please ensure .env exists with Railway DATABASE_URL');
  }

  // Parse .env file directly
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  
  // CRITICAL: Override ANY system environment variables with .env values
  Object.keys(envConfig).forEach(key => {
    process.env[key] = envConfig[key];
  });

  // Validate Railway DATABASE_URL
  const databaseUrl = envConfig.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('❌ DATABASE_URL not found in .env file');
  }

  if (!databaseUrl.startsWith('postgresql://')) {
    throw new Error(`❌ Invalid DATABASE_URL format. Expected postgresql://, got: ${databaseUrl.substring(0, 20)}...`);
  }

  if (databaseUrl.includes('digitalocean.com') || databaseUrl.includes('finsightai')) {
    throw new Error('❌ CRITICAL: FinsightAI/DigitalOcean database detected! This should be Railway only.');
  }

  if (!databaseUrl.includes('railway')) {
    console.warn('⚠️  DATABASE_URL does not contain "railway" - please verify this is your Railway database');
  }

  console.log('✅ Railway PostgreSQL configuration loaded successfully');
  console.log(`🔗 Database: ${databaseUrl.substring(0, 30)}...`);
  
  return databaseUrl;
};

// Export the validated Railway database URL
export const getRailwayDatabaseUrl = (): string => {
  return loadRailwayConfig();
};

// Auto-load on import
loadRailwayConfig();