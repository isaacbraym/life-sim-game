import { Event } from './packages/core/src/schemas/event';
import * as fs from 'fs';
import * as path from 'path';

const eventsBaseDir = path.join('content', 'events');

function getJsonFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getJsonFiles(fullPath));
    } else if (file.endsWith('.json')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getJsonFiles(eventsBaseDir);

let success = true;
console.log(`Starting validation of ${files.length} files in ${eventsBaseDir}...`);

for (const filePath of files) {
  const fileRelative = path.relative(eventsBaseDir, filePath);
  try {
    const rawContent = fs.readFileSync(filePath, 'utf8');
    const content = JSON.parse(rawContent);
    const result = Event.safeParse(content);
    if (!result.success) {
      console.error(`\n❌ Validation failed for ${fileRelative}:`);
      console.error(JSON.stringify(result.error.format(), null, 2));
      success = false;
    } else {
      console.log(`✅ ${fileRelative} is valid!`);
    }
  } catch (e: any) {
    console.error(`\n❌ Error reading/parsing ${fileRelative}:`);
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
