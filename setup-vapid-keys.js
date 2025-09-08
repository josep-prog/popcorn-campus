#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Your generated VAPID keys
const VAPID_PUBLIC_KEY = 'BLx3bLGxwnA53n6oRDFOg9-gKQtZeG3WRDKuf3Jwd0rvPmoEdvpdg87_JjED2mCGPvKBZqwwMr497iupAPzaEf8';
const VAPID_PRIVATE_KEY = 'TIdYVCaBxDyswrb_0nVaDMakiH7QScjK0OUXB3JaZg8';

// Environment variables content
const envContent = `# VAPID Keys for Push Notifications
# These keys are used to authenticate push notifications from your server
# Keep the private key secure and never commit it to version control

# Public key (safe to expose in client-side code)
VITE_VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}

# Private key (keep this secret - only use on server-side)
VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}

# Your email for VAPID identification (replace with your actual email)
VAPID_EMAIL=mailto:your-email@example.com
`;

// Create .env file
const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📝 Please update VAPID_EMAIL with your actual email address');
  console.log('🔒 Make sure .env is in your .gitignore file');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('\n📋 Manual setup instructions:');
  console.log('1. Create a .env file in your project root');
  console.log('2. Add the following content:');
  console.log('\n' + envContent);
}

console.log('\n🔑 Your VAPID Keys:');
console.log('Public Key:', VAPID_PUBLIC_KEY);
console.log('Private Key:', VAPID_PRIVATE_KEY);
console.log('\n⚠️  Important:');
console.log('- Keep the private key secret');
console.log('- Add .env to your .gitignore file');
console.log('- Update VAPID_EMAIL with your actual email');
