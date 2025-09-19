const fs = require('fs');

const content = fs.readFileSync('pages/carrito.tsx', 'utf8');
const lines = content.split('\n');

console.log('=== LÍNEAS ALREDEDOR DEL ERROR ===');
for (let i = 359; i <= 372; i++) {
  const lineNum = i + 1;
  const line = lines[i] || '';
  console.log(`Line ${lineNum}: "${line}" (length: ${line.length})`);
}

console.log('\n=== ANÁLISIS DETALLADO ===');
for (let i = 359; i <= 372; i++) {
  const lineNum = i + 1;
  const line = lines[i] || '';
  const chars = line.split('').map(c => {
    if (c === ' ') return 'SPACE';
    if (c === '\t') return 'TAB';
    if (c === '\r') return 'CR';
    if (c === '\n') return 'LF';
    return c;
  });
  console.log(`Line ${lineNum}: [${chars.join(', ')}]`);
}