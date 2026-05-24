import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  execSync('npx tsx scripts/validate-events.ts', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
} catch (error) {
  process.exit(1);
}
