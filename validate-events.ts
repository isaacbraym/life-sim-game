import { Event } from './packages/core/src/schemas/event';
import * as fs from 'fs';
import * as path from 'path';

const eventsDir = path.join('content', 'events', 'crime');
const files = fs.readdirSync(eventsDir).filter(f => f.endsWith('.json'));

let success = true;
console.log(`Starting validation of ${files.length} files in ${eventsDir}...`);

for (const file of files) {
  const filePath = path.join(eventsDir, file);
  try {
    const rawContent = fs.readFileSync(filePath, 'utf8');
    const content = JSON.parse(rawContent);
    const result = Event.safeParse(content);
    if (!result.success) {
      console.error(`\n❌ Validation failed for ${file}:`);
      console.error(JSON.stringify(result.error.format(), null, 2));
      success = false;
    } else {
      console.log(`✅ ${file} is valid!`);
    }
  } catch (e: any) {
    console.error(`\n❌ Error reading/parsing ${file}:`);
    console.error(e.message || e);
    success = false;
  }
}

if (!success) {
  console.log('\nSome validations failed.');
  process.exit(1);
} else {
  console.log('\nAll files validated successfully! 🎉');
}
