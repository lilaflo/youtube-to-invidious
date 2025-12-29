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

    // Bundle JavaScript
    exec('mkdir -p dist/src', 'Creating dist directory');
    exec('node scripts/bundle-content.js', 'Bundling content script');
    exec('cp src/options.js dist/src/', 'Copying options script');
    exec('cp src/options.html dist/src/', 'Copying options HTML');

    exec('rm -rf dist-chrome', 'Cleaning Chrome distribution directory');
    exec('mkdir -p dist-chrome', 'Creating Chrome dist directory');
    exec('cp -r dist/src dist-chrome/', 'Copying bundled scripts');
    exec('cp -r icons dist-chrome/', 'Copying icons');

    // Modify manifest for Chrome: add activeTab permission
    console.log('\nAdding Chrome-specific permissions...');
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    if (!manifest.permissions.includes('activeTab')) {
      manifest.permissions.push('activeTab');
    }
    // Remove Firefox-specific settings
    delete manifest.browser_specific_settings;
    fs.writeFileSync('dist-chrome/manifest.json', JSON.stringify(manifest, null, 2));
    console.log('✓ Chrome manifest created with activeTab permission');

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
