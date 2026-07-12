/** Re-export pour le backend — implémentation dans shared/org-layout.js */
const path = require('path');
const fs = require('fs');

const candidates = [
  path.join(__dirname, '../../shared/org-layout.js'),
  path.join(__dirname, '../../../shared/org-layout.js'),
  '/shared/org-layout.js',
];

let loaded;
for (const candidate of candidates) {
  if (fs.existsSync(candidate)) {
    loaded = require(candidate);
    break;
  }
}

if (!loaded) {
  throw new Error('shared/org-layout.js introuvable');
}

module.exports = loaded;
