// Script to set up Vercel environment variables
// This script will help you configure your Vercel project with the required environment variables

const { execSync } = require('child_process');

console.log('🚀 Setting up Vercel Environment Variables');
console.log('========================================');

// Firebase Configuration
const firebaseEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_DATABASE_URL',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
];

// API Keys
const apiKeys = [
  'HUGGING_FACE_API_TOKEN'
];

// Application Settings
const appSettings = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_APP_NAME'
];

// Security Settings
const securitySettings = [
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

// Analytics
const analytics = [
  'NEXT_PUBLIC_GA_TRACKING_ID'
];

// Development Settings
const devSettings = [
  'NODE_ENV',
  'DEBUG'
];

// All environment variables
const allEnvVars = [
  ...firebaseEnvVars,
  ...apiKeys,
  ...appSettings,
  ...securitySettings,
  ...analytics,
  ...devSettings
];

// Function to set environment variable
function setEnvVar(varName, value, environments = ['production', 'preview', 'development']) {
  try {
    console.log(`\n🔧 Setting ${varName}...`);
    
    // Create a temporary file with the value
    require('fs').writeFileSync('.temp-env-value', value || '');
    
    // Set the environment variable using vercel cli
    const cmd = `vercel env add ${varName} ${environments.join(' ')} < .temp-env-value`;
    execSync(cmd, { stdio: 'inherit' });
    
    // Remove temporary file
    require('fs').unlinkSync('.temp-env-value');
    
    console.log(`✅ ${varName} set successfully`);
  } catch (error) {
    console.error(`❌ Failed to set ${varName}:`, error.message);
  }
}

// Main function
async function main() {
  console.log('This script will help you set up environment variables for your Vercel project.');
  console.log('You will be prompted for each variable. Press Enter to skip a variable.\n');
  
  // Firebase Configuration
  console.log('\n🔥 FIREBASE CONFIGURATION');
  console.log('Get these from Firebase Console > Project Settings > General > Your apps\n');
  
  for (const varName of firebaseEnvVars) {
    const value = require('readline-sync').question(`${varName}: `);
    if (value.trim()) {
      setEnvVar(varName, value);
    }
  }
  
  // API Keys
  console.log('\n🔑 API KEYS');
  console.log('Hugging Face API for AI QR generation (optional)\n');
  
  for (const varName of apiKeys) {
    const value = require('readline-sync').question(`${varName}: `);
    if (value.trim()) {
      setEnvVar(varName, value);
    }
  }
  
  // Application Settings
  console.log('\n⚙️ APPLICATION SETTINGS\n');
  
  for (const varName of appSettings) {
    const defaultValue = varName === 'NEXT_PUBLIC_APP_URL' ? 'https://your-app-url.vercel.app' : 
                        varName === 'NEXT_PUBLIC_APP_NAME' ? 'HOYN!' : '';
    const value = require('readline-sync').question(`${varName} (default: ${defaultValue}): `) || defaultValue;
    if (value.trim()) {
      setEnvVar(varName, value);
    }
  }
  
  // Security Settings
  console.log('\n🔒 SECURITY SETTINGS');
  console.log('Generate NEXTAUTH_SECRET with: openssl rand -base64 32\n');
  
  for (const varName of securitySettings) {
    const value = require('readline-sync').question(`${varName}: `);
    if (value.trim()) {
      setEnvVar(varName, value);
    }
  }
  
  // Analytics
  console.log('\n📈 ANALYTICS (Optional)\n');
  
  for (const varName of analytics) {
    const value = require('readline-sync').question(`${varName}: `);
    if (value.trim()) {
      setEnvVar(varName, value);
    }
  }
  
  // Development Settings
  console.log('\n💻 DEVELOPMENT SETTINGS\n');
  
  setEnvVar('NODE_ENV', 'production', ['production']);
  setEnvVar('NODE_ENV', 'development', ['development', 'preview']);
  setEnvVar('DEBUG', 'false');
  
  console.log('\n🎉 Environment variables setup completed!');
  console.log('Now you can deploy your project to Vercel.');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}