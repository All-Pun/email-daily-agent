#!/usr/bin/env node
// One-time script to get your Gmail OAuth refresh token.
// Run: node scripts/setup-gmail-auth.mjs
import { google } from 'googleapis';
import http from 'http';
import { URL } from 'url';

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3001/oauth2callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    '❌ Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in your environment first.\n' +
    '   export GMAIL_CLIENT_ID=...\n' +
    '   export GMAIL_CLIENT_SECRET=...'
  );
  process.exit(1);
}

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const url = auth.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
  ],
});

// Start a local server to catch the redirect
const server = http.createServer(async (req, res) => {
  const qs = new URL(req.url, REDIRECT_URI).searchParams;
  const code = qs.get('code');

  if (!code) {
    res.end('No code received. Try again.');
    return;
  }

  res.end('<h2>✅ Auth successful! You can close this tab.</h2>');
  server.close();

  try {
    const { tokens } = await auth.getToken(code);
    console.log('\n✅ Add these to your .env.local:\n');
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\nThen add to Vercel:\n  vercel env add GMAIL_REFRESH_TOKEN\n');
  } catch (err) {
    console.error('❌ Failed to exchange code:', err.message);
  }
});

server.listen(3001, () => {
  console.log('\n⚠️  IMPORTANT: In Google Cloud Console, add this as an Authorized Redirect URI:');
  console.log('   http://localhost:3001/oauth2callback\n');
  console.log('1. Open this URL in your browser:\n');
  console.log('   ' + url + '\n');
  console.log('Waiting for Google to redirect back...');
});
