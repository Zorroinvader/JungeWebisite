// Comprehensive fix for all syntax errors in httpApi.js
const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/services/httpApi.js', 'utf8');

// Fix all patterns where headers are incorrectly placed
const fixes = [
  // Fix: headers: await getHeaders() -> const headers = await getHeaders() before fetch
  {
    pattern: /(\s+)(const \w+ = await fetch\([^}]+{\s*method: '[^']+',\s*headers: await getHeaders\(\)[^}]+})/g,
    replacement: (match, indent, fetchCall) => {
      return `${indent}const headers = await getHeaders()\n${indent}const response = await fetch(${fetchCall.replace('headers: await getHeaders(),', 'headers,')}`;
    }
  },
  // Fix: const headers = await getHeaders() inside fetch object
  {
    pattern: /(\s+)(const \w+ = await fetch\([^}]+{\s*method: '[^']+',\s*const headers = await getHeaders\(\)[^}]+})/g,
    replacement: (match, indent, fetchCall) => {
      return `${indent}const headers = await getHeaders()\n${indent}const response = await fetch(${fetchCall.replace(/const headers = await getHeaders\(\)[,\s]*/, '')}`;
    }
  },
  // Fix: duplicate headers lines
  {
    pattern: /(\s+)(const \w+ = await fetch\([^}]+{\s*method: '[^']+',\s*headers: await getHeaders\(\)\s+headers: await getHeaders\(\)[^}]+})/g,
    replacement: (match, indent, fetchCall) => {
      return `${indent}const headers = await getHeaders()\n${indent}const response = await fetch(${fetchCall.replace(/headers: await getHeaders\(\)\s+headers: await getHeaders\(\)[,\s]*/, 'headers,')}`;
    }
  }
];

// Apply all fixes
fixes.forEach(fix => {
  content = content.replace(fix.pattern, fix.replacement);
});

// Write back to file
fs.writeFileSync('src/services/httpApi.js', content);

console.log('Applied comprehensive fixes to httpApi.js');
