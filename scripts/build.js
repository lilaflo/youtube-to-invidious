#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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

function copyDir(src, dest) {
  exec(`mkdir -p ${dest}`, `Creating ${dest} directory`);
  exec(`cp -r ${src}/* ${dest}/`, `Copying files to ${dest}`);
}

async function build() {
  try {
    // Read version from package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const version = packageJson.version;

    console.log(`\nBuilding version ${version}...`);

    // Build Chrome version (includes signing if privatekey.pem exists)
    console.log('\n=== Building Chrome version ===');
    exec('node scripts/build-chrome.js', 'Building Chrome extension');

    // Build Firefox version
    console.log('\n=== Building Firefox version ===');
    exec('node scripts/build-firefox.js', 'Building Firefox extension');

    console.log('\n✓ Build completed successfully!');
    console.log(`\nDeployment packages created:`);
    console.log(`  - extension-chrome.zip (unsigned, for Chrome Web Store)`);
    if (fs.existsSync('extension-chrome.crx')) {
      console.log(`  - extension-chrome.crx (signed, for verified CRX upload)`);
    }
    console.log(`  - extension-firefox.zip (for Firefox Add-ons)`);
    console.log(`\nVersion: ${version}`);
  } catch (error) {
    console.error('\n✗ Build failed:', error.message);
    process.exit(1);
  }
}

build();
