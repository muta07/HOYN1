// Script to convert .env.local to Vercel environment variables
const fs = require('fs');

console.log('🚀 Converting .env.local to Vercel Environment Variables');
console.log('======================================================');

// Read .env.local file
const envLocalContent = fs.readFileSync('.env.local', 'utf8');

// Split into lines
const lines = envLocalContent.split('\n');

// Filter out comments and empty lines
const envVars = lines.filter(line => line.trim() !== '' && !line.startsWith('#'));

console.log('\n📋 Environment Variables to Set:');
console.log('==============================');

// Process each line
envVars.forEach(line => {
  // Skip lines that start with # (comments)
  if (line.startsWith('#')) return;
  
  // Skip empty lines
  if (line.trim() === '') return;
  
  // Split by = to get key and value
  const [key, ...valueParts] = line.split('=');
  const value = valueParts.join('=');
  
  // Skip if key is empty
  if (!key) return;
  
  console.log(`${key}=${value}`);
});

console.log('\n🔧 To set these variables in Vercel, run the following commands:');
console.log('==================================================================');

// Generate vercel env add commands
envVars.forEach(line => {
  // Skip lines that start with # (comments)
  if (line.startsWith('#')) return;
  
  // Skip empty lines
  if (line.trim() === '') return;
  
  // Split by = to get key and value
  const [key, ...valueParts] = line.split('=');
  const value = valueParts.join('=');
  
  // Skip if key is empty
  if (!key) return;
  
  // Skip empty values
  if (value === '') return;
  
  console.log(`vercel env add ${key} production preview development`);
});

console.log('\n📝 Note: You will be prompted to enter the value for each variable.');
console.log('For security, values are not shown in this script output.');
console.log('Enter the actual values when prompted by the Vercel CLI.');