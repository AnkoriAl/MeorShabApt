#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Shabbat Apartment Program - Backend Setup');
console.log('============================================\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('Please create .env.local with your Supabase credentials:');
  console.log('');
  console.log('VITE_SUPABASE_URL=your_supabase_url_here');
  console.log('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here');
  console.log('');
  process.exit(1);
}

// Read and validate .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const hasUrl = envContent.includes('VITE_SUPABASE_URL=') && !envContent.includes('your_supabase_url_here');
const hasKey = envContent.includes('VITE_SUPABASE_ANON_KEY=') && !envContent.includes('your_supabase_anon_key_here');

if (!hasUrl || !hasKey) {
  console.log('❌ .env.local file is not properly configured!');
  console.log('Please update .env.local with your actual Supabase credentials.');
  console.log('');
  console.log('Get your credentials from: https://supabase.com/dashboard/project/[your-project]/settings/api');
  process.exit(1);
}

console.log('✅ .env.local file is configured');

// Check if supabase-schema.sql exists
const schemaPath = path.join(__dirname, 'supabase-schema.sql');
if (!fs.existsSync(schemaPath)) {
  console.log('❌ supabase-schema.sql file not found!');
  process.exit(1);
}

console.log('✅ Database schema file found');

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('❌ Dependencies not installed!');
  console.log('Please run: npm install');
  process.exit(1);
}

console.log('✅ Dependencies are installed');

console.log('\n🎉 Setup validation complete!');
console.log('\nNext steps:');
console.log('1. Go to your Supabase dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy the contents of supabase-schema.sql');
console.log('4. Paste and run the SQL in Supabase');
console.log('5. Start your app with: npm run dev');
console.log('\nFor detailed instructions, see BACKEND_SETUP.md');
