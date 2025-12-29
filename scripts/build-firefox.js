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

    // Bundle JavaScript
    exec('mkdir -p dist/src', 'Creating dist directory');
    exec('node scripts/bundle-content.js', 'Bundling content script');
    exec('cp src/background.js dist/src/', 'Copying background script');
    exec('cp src/options.js dist/src/', 'Copying options script');
    exec('cp src/options.html dist/src/', 'Copying options HTML');

    exec('rm -rf dist-firefox', 'Cleaning Firefox distribution directory');
    exec('mkdir -p dist-firefox', 'Creating Firefox dist directory');
    exec('cp -r dist/src dist-firefox/', 'Copying bundled scripts');
    exec('cp -r icons dist-firefox/', 'Copying icons');

    // Modify manifest for Firefox: use scripts instead of service_worker
    console.log('\nProcessing manifest for Firefox...');
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    if (manifest.background?.service_worker) {
      manifest.background = {
        scripts: [manifest.background.service_worker]
      };
    }
    fs.writeFileSync('dist-firefox/manifest.json', JSON.stringify(manifest, null, 2));
    console.log('✓ Firefox manifest created');
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
