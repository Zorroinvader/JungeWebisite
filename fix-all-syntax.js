// Script to fix all remaining syntax errors in httpApi.js
const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/services/httpApi.js', 'utf8');

// Fix all patterns where const headers = await getHeaders() appears inside fetch objects
const patterns = [
  // Pattern 1: const response = await fetch(..., { method: '...', const headers = await getHeaders() headers, ... })
  {
    regex: /(\s+)(const \w+ = await fetch\([^}]+{\s*method: '[^']+',\s*const headers = await getHeaders\(\)\s+headers,[^}]+})/g,
    replacement: (match, indent, fetchCall) => {
      return `${indent}const headers = await getHeaders()\n${indent}const response = await fetch(${fetchCall.replace(/const headers = await getHeaders\(\)\s+/, '')}`;
    }
  },
  // Pattern 2: const response = await fetch(..., { method: '...', const headers = await getHeaders()\n\n        headers, ... })
  {
    regex: /(\s+)(const \w+ = await fetch\([^}]+{\s*method: '[^']+',\s*const headers = await getHeaders\(\)\s+\s+headers,[^}]+})/g,
    replacement: (match, indent, fetchCall) => {
      return `${indent}const headers = await getHeaders()\n${indent}const response = await fetch(${fetchCall.replace(/const headers = await getHeaders\(\)\s+\s+/, '')}`;
    }
  }
];

// Apply all patterns
patterns.forEach(pattern => {
  content = content.replace(pattern.regex, pattern.replacement);
});

// Write back to file
fs.writeFileSync('src/services/httpApi.js', content);

console.log('Fixed all syntax errors in httpApi.js');
