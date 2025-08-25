const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'compiled', 'mini-css-extract-plugin', 'hmr', 'hotModuleReplacement.js');

try {
  let content = fs.readFileSync(file, 'utf8');
  const patched = content.replace(/e\.parentNode\.removeChild\(e\)/g, 'e.parentNode && e.parentNode.removeChild(e)');
  if (patched !== content) {
    fs.writeFileSync(file, patched, 'utf8');
    console.log('Patched mini-css-extract-plugin HMR to guard against null parentNode');
  }
} catch (err) {
  console.error('Failed to patch mini-css-extract-plugin HMR', err);
}
