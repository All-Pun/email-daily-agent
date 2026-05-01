#!/usr/bin/env node
// One-time script to get your Gmail OAuth refresh token.
// Run: node scripts/setup-gmail-auth.mjs
import { google } from 'googleapis';
import * as readline from 'readline';

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    '❌ Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in your environment first.\n' +
    '   export GMAIL_CLIENT_ID=...\n' +
    '   export GMAIL_CLIENT_SECRET=...'
  );
  process.exit(1);
}

const auth = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob'
);

const url = auth.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
  ],
});

console.log('\n1. Open this URL in your browser:\n');
console.log('   ' + url);
console.log('\n2. Approve access, then paste the code below:\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Code: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await auth.getToken(code.trim());
    console.log('\n✅ Add these to your .env.local:\n');
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\nAlso add to Vercel:\n  vercel env add GMAIL_REFRESH_TOKEN');
  } catch (err) {
    console.error('❌ Failed to exchange code:', err.message);
  }
});
