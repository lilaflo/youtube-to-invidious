#!/usr/bin/env node

import fs from 'fs';
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

async function buildChrome() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const version = packageJson.version;

    console.log(`\nBuilding Chrome version ${version}...`);

    exec('rm -rf dist-chrome', 'Cleaning Chrome distribution directory');
    exec('mkdir -p dist-chrome', 'Creating Chrome dist directory');
    exec('cp -r src dist-chrome/', 'Copying source files');
    exec('cp -r icons dist-chrome/', 'Copying icons');
    exec('cp manifest.json dist-chrome/', 'Copying manifest');
    exec('rm -f extension-chrome.zip', 'Cleaning old package');
    exec('cd dist-chrome && zip -r ../extension-chrome.zip *', 'Creating Chrome zip');

    console.log('\n✓ Chrome build completed successfully!');
    console.log(`\nPackage: extension-chrome.zip`);
    console.log(`Version: ${version}`);
  } catch (error) {
    console.error('\n✗ Chrome build failed:', error.message);
    process.exit(1);
  }
}

buildChrome();
