#!/usr/bin/env node
/**
 * build.js — Generates a single self-contained HTML file
 * Usage: node build.js
 * Output: dist/DataSecurity-Report.html
 */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const distDir = path.join(root, 'dist');
const assetsDir = path.join(root, 'assets');

// ─── Helper: convert a local image file to a data URI ───
const mimeTypes = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
function toDataUri(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = mimeTypes[ext];
  if (!mime) return null;
  if (ext === '.svg') {
    const svg = fs.readFileSync(filePath, 'utf8');
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  const buf = fs.readFileSync(filePath);
  return 'data:' + mime + ';base64,' + buf.toString('base64');
}

// Build a map of asset filename → data URI for all images in assets/
const assetMap = {};
fs.readdirSync(assetsDir).forEach(function(name) {
  const full = path.join(assetsDir, name);
  if (!fs.statSync(full).isFile()) return;
  const uri = toDataUri(full);
  if (uri) assetMap[name] = uri;
});
console.log('Embedded ' + Object.keys(assetMap).length + ' images as data URIs');

// Read source files
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
const findingsJson = fs.readFileSync(path.join(root, 'data', 'findings.json'), 'utf8');

// 1. Replace the data loading with inline data + direct initialization
const modifiedJs = js.replace(
  /\/\/ Load findings from.*?var findings = \[\];/s,
  '// Findings data (embedded)\n  var findings = ' + findingsJson.trim() + ';'
).replace(
  /function loadFindings[\s\S]*?console\.error\('Failed to load findings\.json',\s*e\);\s*\}\s*\}/,
  [
    '// Ensure each item has a notes field',
    '  findings.forEach(function(f) { if (!f.notes) f.notes = \'\'; });',
    '',
    '  // Apply localStorage overrides on top',
    '  try {',
    '    var saved = JSON.parse(localStorage.getItem(\'findings-overrides\'));',
    '    if (saved && saved.length === findings.length) {',
    '      saved.forEach(function(o, i) {',
    '        if (o.phase) findings[i].phase = o.phase;',
    '        if (o.status !== undefined) findings[i].status = o.status;',
    '        if (o.owner) findings[i].owner = o.owner;',
    '        if (o.notes !== undefined) findings[i].notes = o.notes;',
    '      });',
    '    }',
    '  } catch(e) {}',
    '',
    '  // Migrate any old per-item postit-note-* keys into findings',
    '  findings.forEach(function(f, i) {',
    '    if (!f.notes) {',
    '      try {',
    '        var old = localStorage.getItem(\'postit-note-\' + i);',
    '        if (old) { f.notes = old; localStorage.removeItem(\'postit-note-\' + i); }',
    '      } catch(e) {}',
    '    }',
    '  });',
    '',
    '  // Assign category-based IDs (I01, S01, C01, D01, ...)',
    '  var categoryPrefixes = { \'Identify\': \'I\', \'Switch\': \'S\', \'Configure\': \'C\', \'Deploy\': \'D\' };',
    '  var categoryCounts = {};',
    '  findings.forEach(function(f) {',
    '    var prefix = categoryPrefixes[f.category] || \'X\';',
    '    categoryCounts[prefix] = (categoryCounts[prefix] || 0) + 1;',
    '    f.id = prefix + String(categoryCounts[prefix]).padStart(2, \'0\');',
    '  });',
    '',
    '  initFindingsUI();'
  ].join('\n')
);

// 2. Inline CSS: replace <link rel="stylesheet" href="css/styles.css" /> with <style>
let output = html.replace(
  /<link\s+rel="stylesheet"\s+href="css\/styles\.css"\s*\/>/,
  '<style>\n' + css + '\n</style>'
);

// 3. Remove the inline findings.js script tag (data is already embedded in app.js)
output = output.replace(
  /\s*<script src="data\/findings\.js"><\/script>\s*\n/,
  '\n'
);

// 4. Inline JS: replace <script src="js/app.js"></script> with inline <script>
output = output.replace(
  /<script\s+src="js\/app\.js"><\/script>/,
  '<script>\n' + modifiedJs + '\n<\/script>'
);

// 4. Inline images: replace all src="assets/..." and data-src="assets/..." with data URIs
output = output.replace(/(src|data-src)="assets\/([^"]+)"/g, function(match, attr, filename) {
  if (assetMap[filename]) return attr + '="' + assetMap[filename] + '"';
  console.warn('  Warning: missing asset for ' + filename);
  return match;
});

// Also replace JS string references to 'assets/Reco##.png' with data URIs
// The JS builds image paths like: 'assets/Reco' + num + '.png'
// We replace findingsImageMap probe with a pre-built map
var recoMapEntries = [];
Object.keys(assetMap).forEach(function(name) {
  var m = name.match(/^Reco(\d+)\.png$/);
  if (m) recoMapEntries.push(parseInt(m[1], 10) - 1 + ': "' + assetMap[name] + '"');
});
var recoMapJs = '{' + recoMapEntries.join(',\n') + '}';

// Replace the image probe setup block with a static map (only the probe code, not everything between)
output = output.replace(
  /\/\/ Auto-detect which findings have images \(Reco##\.png in assets\/\)\s*\n\s*var findingsImageMap = \{\};\s*\n\s*var imageProbePromises = findings\.map[\s\S]*?\}\);\s*\n\s*\}\);\s*\n/,
  '// Embedded image map (data URIs)\n  var embeddedImageMap = ' + recoMapJs + ';\n  var findingsImageMap = {};\n  Object.keys(embeddedImageMap).forEach(function(k) { findingsImageMap[k] = true; });\n\n'
);

// Replace Promise.all(imageProbePromises).then(function() { render(0, 'next'); });
// with an immediate call since images are already embedded
output = output.replace(
  /\/\/ Initial render after image probes resolve\s*\n\s*Promise\.all\(imageProbePromises\)\.then\(function\(\)\s*\{\s*\n\s*render\(0,\s*'next'\);\s*\n\s*\}\);/,
  '// Initial render (images are embedded)\n  render(0, \'next\');'
);

// Replace imagePath references to use the embedded map
output = output.replace(
  /var imagePath = 'assets\/Reco' \+ imageNum \+ '\.png';/g,
  "var imagePath = embeddedImageMap[index] || ('assets/Reco' + imageNum + '.png');"
);

// 5. Write output
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);
const outPath = path.join(distDir, 'DataSecurity-Report.html');
fs.writeFileSync(outPath, output, 'utf8');

const sizeKB = (Buffer.byteLength(output, 'utf8') / 1024).toFixed(1);
const sizeMB = (Buffer.byteLength(output, 'utf8') / 1048576).toFixed(2);
console.log('Built: ' + outPath + ' (' + sizeKB + ' KB / ' + sizeMB + ' MB)');
