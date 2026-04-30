const fs = require('fs');
const exhibits = JSON.parse(fs.readFileSync('exhibits.json','utf8'));
let ok = 0, miss = 0;
exhibits.forEach(e => {
  const p = e.localImage;
  const exists = p && fs.existsSync(p);
  console.log(`${e.id}: ${exists ? 'OK' : 'MISSING'}${exists ? '' : ' -> ' + (e.image || 'no remote')}`);
  if(exists) ok++; else miss++;
});
console.log(`\nSummary: ${ok} present, ${miss} missing`);
