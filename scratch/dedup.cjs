const fs = require('fs');
const content = fs.readFileSync('server/db.ts', 'utf8');
const lines = content.split('\n');
const seen = new Set();
const newLines = [];
let inFunction = false;
let currentFunctionName = '';

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^export async function (\w+)/);
    if (match) {
        const name = match[1];
        if (seen.has(name)) {
            console.log(`Removing duplicate function: ${name} at line ${i + 1}`);
            // Skip until the end of the function (assuming simple structure)
            while (i < lines.length && !lines[i].includes('}')) {
                i++;
            }
            continue;
        }
        seen.add(name);
    }
    newLines.push(line);
}

fs.writeFileSync('server/db.ts', newLines.join('\n'));
console.log('Cleanup complete.');
