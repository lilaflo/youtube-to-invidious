#!/usr/bin/env node

import fs from 'fs';

// Read utils.js and content.js
const utilsCode = fs.readFileSync('src/utils.js', 'utf8');
const contentCode = fs.readFileSync('src/content.js', 'utf8');

// Extract only the function definitions from utils.js (remove export keywords)
const utilsFunctions = utilsCode
  .replace(/^import .+$/gm, '') // Remove imports
  .replace(/export /g, '') // Remove export keywords
  .trim();

// Remove the import statement from content.js - handles multi-line imports
const contentWithoutImport = contentCode
  .replace(/^import\s*\{[^}]*\}\s*from\s*['"].+['"];\s*$/gm, '') // Remove import statements
  .replace(/^import .+$/gm, '') // Remove any remaining import lines
  .trim();

// Combine: utilities first, then content script
const bundled = `/**
 * Bundled content script for YouTube to Invidious extension
 * This file combines utils.js and content.js for browser compatibility
 */

(function() {
'use strict';

${utilsFunctions}

${contentWithoutImport}

})();
`;

// Write bundled file
fs.writeFileSync('dist/src/content.js', bundled);
console.log('✓ Bundled content.js created');
