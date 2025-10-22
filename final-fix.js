// Final comprehensive fix for all syntax errors in httpApi.js
const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/services/httpApi.js', 'utf8');

// Fix all patterns where const headers = await getHeaders() is inside fetch objects
const patterns = [
  // Pattern 1: const response = await fetch(..., { method: '...', const headers = await getHeaders()\n\n        headers, ... })
  {
    regex: /(\s+)(const \w+ = await fetch\([^}]+{\s*method: '[^']+',\s*const headers = await getHeaders\(\)\s+\s+headers,[^}]+})/g,
    replacement: (match, indent, fetchCall) => {
      return `${indent}const headers = await getHeaders()\n${indent}const response = await fetch(${fetchCall.replace(/const headers = await getHeaders\(\)\s+\s+/, '')}`;
    }
  },
  // Pattern 2: const response = await fetch(..., { method: '...', const headers = await getHeaders()\n\n        headers: getHeaders() ... })
  {
    regex: /(\s+)(const \w+ = await fetch\([^}]+{\s*method: '[^']+',\s*const headers = await getHeaders\(\)\s+\s+headers: getHeaders\(\)[^}]+})/g,
    replacement: (match, indent, fetchCall) => {
      return `${indent}const headers = await getHeaders()\n${indent}const response = await fetch(${fetchCall.replace(/const headers = await getHeaders\(\)\s+\s+headers: getHeaders\(\)[,\s]*/, 'headers,')}`;
    }
  },
  // Pattern 3: const response = await fetch(..., { method: '...', const headers = await getHeaders()\n\n        headers, ... })
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

console.log('Applied final comprehensive fixes to httpApi.js');
