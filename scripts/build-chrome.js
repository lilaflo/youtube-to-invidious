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
    exec('cp src/background.js dist/src/', 'Copying background script');
    exec('cp src/options.js dist/src/', 'Copying options script');
    exec('cp src/options.html dist/src/', 'Copying options HTML');

    exec('rm -rf dist-chrome', 'Cleaning Chrome distribution directory');
    exec('mkdir -p dist-chrome', 'Creating Chrome dist directory');
    exec('cp -r dist/src dist-chrome/', 'Copying bundled scripts');
    exec('cp -r icons dist-chrome/', 'Copying icons');

    // Modify manifest for Chrome: remove Firefox-specific settings
    console.log('\nProcessing manifest for Chrome...');
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    delete manifest.browser_specific_settings;
    fs.writeFileSync('dist-chrome/manifest.json', JSON.stringify(manifest, null, 2));
    console.log('✓ Chrome manifest created');

    exec('rm -f extension-chrome.zip', 'Cleaning old package');
    exec('cd dist-chrome && zip -r ../extension-chrome.zip *', 'Creating Chrome zip');

    // Sign extension if private key exists
    if (fs.existsSync('privatekey.pem')) {
      console.log('\n=== Signing extension ===');
      const chromePath = process.platform === 'darwin'
        ? '/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome'
        : 'google-chrome';

      try {
        exec(
          `${chromePath} --pack-extension=dist-chrome --pack-extension-key=privatekey.pem`,
          'Signing extension with private key'
        );

        // Move the generated CRX file
        if (fs.existsSync('dist-chrome.crx')) {
          exec('rm -f extension-chrome.crx', 'Cleaning old CRX');
          fs.renameSync('dist-chrome.crx', 'extension-chrome.crx');
          console.log('✓ Signed CRX created: extension-chrome.crx');
        }
      } catch (error) {
        console.warn('⚠ Signing failed, continuing without signed package');
      }
    } else {
      console.log('\n⚠ Skipping signing - privatekey.pem not found');
      console.log('Generate a key: openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out privatekey.pem');
    }

    console.log('\n✓ Chrome build completed successfully!');
    console.log(`\nPackages created:`);
    console.log(`  - extension-chrome.zip (unsigned, for manual upload)`);
    if (fs.existsSync('extension-chrome.crx')) {
      console.log(`  - extension-chrome.crx (signed, for verified CRX upload)`);
    }
    console.log(`Version: ${version}`);
  } catch (error) {
    console.error('\n✗ Chrome build failed:', error.message);
    process.exit(1);
  }
}

buildChrome();
