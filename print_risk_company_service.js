const fs = require('fs');

const path = 'c:/Users/ASUS/Desktop/SOUTHLAKE_APP/Main_Southlake/southlake_service/src/modules/masters/masters.service.ts';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

console.log('--- PRINTING updateRiskCompany ---');
let capture = false;
let captureCount = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('updateRiskCompany(') || line.includes('createRiskCompany(')) {
    capture = true;
    captureCount = 0;
    console.log(`\nLine ${i + 1}:`);
  }
  if (capture) {
    console.log(`${i + 1}: ${line}`);
    captureCount++;
    if (captureCount > 30) {
      capture = false;
    }
  }
}
