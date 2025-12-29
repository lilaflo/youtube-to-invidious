#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

function exec(command, description) {
  console.log(`\n${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✓ ${description} completed`);
  } catch (error) {
    console.error(`✗ ${description} failed`);
    throw error;
  }
}

async function signChrome() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const version = packageJson.version;

    console.log(`\nSigning Chrome extension version ${version}...`);

    // Check if private key exists
    if (!fs.existsSync('privatekey.pem')) {
      console.error('✗ privatekey.pem not found!');
      console.log('\nGenerate a private key first:');
      console.log('  openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out privatekey.pem');
      process.exit(1);
    }

    // Build Chrome extension first
    console.log('\n=== Building Chrome extension ===');
    exec('node scripts/build-chrome.js', 'Building Chrome extension');

    // Sign the extension using Chrome
    console.log('\n=== Signing extension ===');
    const chromePath = process.platform === 'darwin'
      ? '/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome'
      : 'google-chrome';

    exec(
      `${chromePath} --pack-extension=dist-chrome --pack-extension-key=privatekey.pem`,
      'Signing extension with private key'
    );

    // Move the generated CRX file
    if (fs.existsSync('dist-chrome.crx')) {
      fs.renameSync('dist-chrome.crx', 'extension-chrome.crx');
      console.log('\n✓ Signed CRX created: extension-chrome.crx');
    }

    console.log('\n✓ Chrome extension signed successfully!');
    console.log(`\nSigned package: extension-chrome.crx`);
    console.log(`Version: ${version}`);

    console.log('\n=== Extract public key for Chrome Web Store ===');
    console.log('Run this command to get your public key:');
    console.log('  openssl rsa -in privatekey.pem -pubout');

  } catch (error) {
    console.error('\n✗ Signing failed:', error.message);
    process.exit(1);
  }
}

signChrome();
