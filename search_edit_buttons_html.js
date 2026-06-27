const fs = require('fs');

const path = 'c:/Users/ASUS/Desktop/SOUTHLAKE_APP/Main_Southlake/southlake_ui/src/app/features/masters/masters.component.html';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

console.log('--- SEARCHING FOR EDIT BUTTONS IN HTML ---');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('open') && line.includes('Edit')) {
    console.log(`Line ${i + 1}: ${line}`);
  }
}
