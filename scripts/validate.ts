import { Event } from '../packages/core/src/schemas/event';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const healthDir = path.resolve(__dirname, '../content/events/health');
const files = fs.readdirSync(healthDir).filter(f => f.endsWith('.json'));

let hasError = false;

console.log(`Checking files in: ${healthDir}`);

for (const file of files) {
  const filePath = path.join(healthDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (e: any) {
    console.error(`Error parsing JSON in ${file}:`, e.message);
    hasError = true;
    continue;
  }

  const result = Event.safeParse(data);
  if (!result.success) {
    console.error(`\n❌ Validation failed for: ${file}`);
    console.error(JSON.stringify(result.error.format(), null, 2));
    hasError = true;
  } else {
    console.log(`✅ ${file} is valid`);
  }
}

if (hasError) {
  console.error('\nSome files failed validation.');
  process.exit(1);
} else {
  console.log('\nAll health event files validated successfully against the Zod schema!');
}
