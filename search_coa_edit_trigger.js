const fs = require('fs');

const path = 'c:/Users/ASUS/Desktop/SOUTHLAKE_APP/Main_Southlake/southlake_ui/src/app/features/chart-of-accounts/chart-of-accounts.component.ts';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

console.log('--- FINDING MODAL OPENING METHODS ---');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('showModal = true') || line.includes('isEditMode = true')) {
    console.log(`Line ${i + 1}: ${line}`);
    // print 10 lines of context upwards
    const start = Math.max(0, i - 10);
    for (let j = start; j <= i; j++) {
      console.log(`  ${j + 1}: ${lines[j]}`);
    }
  }
}
