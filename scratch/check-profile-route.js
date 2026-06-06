const fs = require('fs');
const path = 'C:\\Users\\MOKLET 04\\.gemini\\antigravity-ide\\brain\\140caffd-31c6-4448-a608-08f4aaab768c\\scratch\\openapi.json';
const spec = JSON.parse(fs.readFileSync(path, 'utf8'));

console.log('=== GET /auth/profile ===');
console.log(JSON.stringify(spec.paths['/auth/profile'], null, 2));

console.log('=== GET /projects/user/{username} ===');
console.log(JSON.stringify(spec.paths['/projects/user/{username}'], null, 2));
