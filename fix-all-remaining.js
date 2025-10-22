// Fix all remaining syntax errors in httpApi.js
const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/services/httpApi.js', 'utf8');

// Fix all remaining patterns where const headers = await getHeaders() is inside fetch objects
const fixes = [
  // Fix: const response = await fetch(..., { method: '...', const headers = await getHeaders()\n\n        headers, ... })
  {
    pattern: /(\s+)(const \w+ = await fetch\([^}]+{\s*method: '[^']+',\s*const headers = await getHeaders\(\)\s+\s+headers,[^}]+})/g,
    replacement: (match, indent, fetchCall) => {
      return `${indent}const headers = await getHeaders()\n${indent}const response = await fetch(${fetchCall.replace(/const headers = await getHeaders\(\)\s+\s+/, '')}`;
    }
  },
  // Fix: const response = await fetch(..., { method: '...', const headers = await getHeaders()\n\n        headers: getHeaders() ... })
  {
    pattern: /(\s+)(const \w+ = await fetch\([^}]+{\s*method: '[^']+',\s*const headers = await getHeaders\(\)\s+\s+headers: getHeaders\(\)[^}]+})/g,
    replacement: (match, indent, fetchCall) => {
      return `${indent}const headers = await getHeaders()\n${indent}const response = await fetch(${fetchCall.replace(/const headers = await getHeaders\(\)\s+\s+headers: getHeaders\(\)[,\s]*/, 'headers,')}`;
    }
  },
  // Fix: const response = await fetch(..., { method: '...', const headers = await getHeaders()\n\n        headers, ... })
  {
    pattern: /(\s+)(const \w+ = await fetch\([^}]+{\s*method: '[^']+',\s*const headers = await getHeaders\(\)\s+\s+headers,[^}]+})/g,
    replacement: (match, indent, fetchCall) => {
      return `${indent}const headers = await getHeaders()\n${indent}const response = await fetch(${fetchCall.replace(/const headers = await getHeaders\(\)\s+\s+/, '')}`;
    }
  }
];

// Apply all fixes
fixes.forEach(fix => {
  content = content.replace(fix.pattern, fix.replacement);
});

// Write back to file
fs.writeFileSync('src/services/httpApi.js', content);

console.log('Fixed all remaining syntax errors in httpApi.js');
