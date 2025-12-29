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

    // Build Chrome version
    console.log('\n=== Building Chrome version ===');
    exec('rm -rf dist-chrome', 'Cleaning Chrome distribution directory');
    exec('mkdir -p dist-chrome', 'Creating Chrome dist directory');

    // Copy source files
    exec('cp -r src dist-chrome/', 'Copying source files');
    exec('cp -r icons dist-chrome/', 'Copying icons');
    exec('cp manifest.json dist-chrome/', 'Copying manifest');

    // Build Firefox version
    console.log('\n=== Building Firefox version ===');
    exec('rm -rf dist-firefox', 'Cleaning Firefox distribution directory');
    exec('mkdir -p dist-firefox', 'Creating Firefox dist directory');

    // Copy source files
    exec('cp -r src dist-firefox/', 'Copying source files');
    exec('cp -r icons dist-firefox/', 'Copying icons');
    exec('cp manifest.json dist-firefox/', 'Copying manifest');

    // Create zip files
    console.log('\n=== Creating distribution packages ===');
    exec('rm -f extension-chrome.zip extension-firefox.zip', 'Cleaning old packages');
    exec('cd dist-chrome && zip -r ../extension-chrome.zip *', 'Creating Chrome zip');
    exec('cd dist-firefox && zip -r ../extension-firefox.zip *', 'Creating Firefox zip');

    console.log('\n✓ Build completed successfully!');
    console.log(`\nDeployment packages created:`);
    console.log(`  - extension-chrome.zip (for Chrome Web Store)`);
    console.log(`  - extension-firefox.zip (for Firefox Add-ons)`);
    console.log(`\nVersion: ${version}`);
  } catch (error) {
    console.error('\n✗ Build failed:', error.message);
    process.exit(1);
  }
}

build();
