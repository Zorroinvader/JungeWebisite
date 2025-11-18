#!/usr/bin/env node
/**
 * Supabase Integration Setup Script
 * 
 * This script uses Supabase MCP to:
 * 1. Apply database migrations
 * 2. Set up pg_cron jobs
 * 3. Deploy Edge Functions
 * 
 * Usage:
 *   node scripts/setup-supabase-integration.js
 * 
 * Requirements:
 *   - Supabase MCP server configured
 *   - Project ID from Supabase Dashboard
 */

const fs = require('fs');
const path = require('path');

// Configuration - UPDATE THESE VALUES
const CONFIG = {
  // Get from Supabase Dashboard → Project Settings → General → Reference ID
  projectId: 'YOUR_PROJECT_ID',
  
  // Get from Supabase Dashboard → Project Settings → API → URL
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  
  // Get from Supabase Dashboard → Project Settings → API → service_role key
  serviceRoleKey: 'YOUR_SERVICE_ROLE_KEY',
  
  // Your EC2 Elastic IP or Public IP
  fritzServiceUrl: 'http://YOUR_EC2_IP:8000',
  
  // API Key (must match EC2 .env file)
  fritzServiceApiKey: 'JC!Pferdestall'
};

console.log('=== Supabase Integration Setup ===\n');
console.log('⚠️  IMPORTANT: Update CONFIG in this file first!\n');

// Read migration files
function readMigrationFile(filename) {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  return fs.readFileSync(filePath, 'utf8');
}

// Instructions for manual setup
console.log('Since Supabase MCP requires project ID, here are the steps:\n');
console.log('1. Get your Project ID from Supabase Dashboard');
console.log('2. Run the migrations using Supabase Dashboard SQL Editor\n');

console.log('=== Migration 1: Create Club Status Table ===\n');
console.log(readMigrationFile('create_club_status_table.sql'));
console.log('\n');

console.log('=== Migration 2: Setup pg_cron ===\n');
const pgCronMigration = readMigrationFile('setup_pg_cron.sql');
// Replace placeholders
const pgCronWithConfig = pgCronMigration
  .replace('https://YOUR_PROJECT_REF.supabase.co', CONFIG.supabaseUrl)
  .replace('YOUR_SERVICE_ROLE_KEY', CONFIG.serviceRoleKey);

console.log('First, set database settings:');
console.log(`ALTER DATABASE postgres SET app.settings.supabase_url = '${CONFIG.supabaseUrl}';`);
console.log(`ALTER DATABASE postgres SET app.settings.supabase_service_role_key = '${CONFIG.serviceRoleKey}';\n`);
console.log('Then run the pg_cron migration:\n');
console.log(pgCronWithConfig);
console.log('\n');

console.log('=== Edge Function Secrets ===\n');
console.log('Set these in Supabase Dashboard → Edge Functions → Secrets:\n');
console.log(`FRITZ_SERVICE_URL=${CONFIG.fritzServiceUrl}`);
console.log(`FRITZ_SERVICE_API_KEY=${CONFIG.fritzServiceApiKey}\n`);

console.log('=== Next Steps ===\n');
console.log('1. Apply migrations in Supabase SQL Editor');
console.log('2. Set Edge Function secrets');
console.log('3. Deploy Edge Function: supabase functions deploy check-devices');
console.log('4. Test the integration\n');

