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

async function buildFirefox() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const version = packageJson.version;

    console.log(`\nBuilding Firefox version ${version}...`);

    exec('rm -rf dist-firefox', 'Cleaning Firefox distribution directory');
    exec('mkdir -p dist-firefox', 'Creating Firefox dist directory');
    exec('cp -r src dist-firefox/', 'Copying source files');
    exec('cp -r icons dist-firefox/', 'Copying icons');
    exec('cp manifest.firefox.json dist-firefox/manifest.json', 'Copying Firefox manifest');
    exec('rm -f extension-firefox.zip', 'Cleaning old package');
    exec('cd dist-firefox && zip -r ../extension-firefox.zip *', 'Creating Firefox zip');

    console.log('\n✓ Firefox build completed successfully!');
    console.log(`\nPackage: extension-firefox.zip`);
    console.log(`Version: ${version}`);
  } catch (error) {
    console.error('\n✗ Firefox build failed:', error.message);
    process.exit(1);
  }
}

buildFirefox();
