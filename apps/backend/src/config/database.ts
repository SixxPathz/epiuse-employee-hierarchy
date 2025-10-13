/**
 * FLEXIBLE DATABASE CONFIGURATION
 * This file works with both Railway production (env vars) and local development (.env file)
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment configuration (Railway production OR local .env)
const loadRailwayConfig = () => {
  const envPath = path.resolve(process.cwd(), '.env');
  
  // In Railway production, use environment variables directly
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    console.log('✅ Using Railway production environment variables');
    return process.env.DATABASE_URL;
  }
  
  // For local development, load from .env file
  if (fs.existsSync(envPath)) {
    console.log('📁 Loading local .env file for development');
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    
    // Override system environment variables with .env values for local dev
    Object.keys(envConfig).forEach(key => {
      process.env[key] = envConfig[key];
    });
    
    const databaseUrl = envConfig.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('❌ DATABASE_URL not found in .env file');
    }
    return databaseUrl;
  }
  
  // Neither production env vars nor .env file found
  throw new Error('❌ No database configuration found. Need either Railway env vars or .env file');
};

// Validate and get database URL
const getDatabaseUrl = (): string => {
  const databaseUrl = loadRailwayConfig();
  
  if (!databaseUrl) {
    throw new Error('❌ DATABASE_URL not found');
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
  return getDatabaseUrl();
};

// Auto-load configuration
try {
  getDatabaseUrl();
  console.log('🚀 Database configuration validated');
} catch (error) {
  console.error('❌ Database configuration failed:', error instanceof Error ? error.message : String(error));
  throw error;
}