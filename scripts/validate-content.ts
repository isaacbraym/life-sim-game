import { FurnitureDefinition } from '../packages/core/src/schemas/furniture';
import { ComodoDefinition } from '../packages/core/src/schemas/location';
import { IsoRoomDefinition } from '../packages/core/src/schemas/isoRoom';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentDir = path.resolve(__dirname, '../content');

const EventoHistoricoSchema = z.object({
  id: z.string(),
  manchete: z.string(),
  tags: z.array(z.string()),
  afetaJogabilidade: z.boolean(),
  efeitos: z.array(z.unknown()),
  eraDisponivel: z.object({
    startYear: z.number().int(),
    endYear: z.number().int().optional(),
  }).optional(),
});

const HistoricalFileSchema = z.object({
  ano: z.number().int(),
  eventos: z.array(EventoHistoricoSchema),
});

function getJsonFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(getJsonFiles(fullPath));
    } else if (file.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

let success = true;

// --- Furniture ---
const furnitureDir = path.join(contentDir, 'furniture');
const furnitureFiles = getJsonFiles(furnitureDir);
console.log(`\n[furniture] ${furnitureFiles.length} arquivo(s) encontrado(s)`);
for (const filePath of furnitureFiles) {
  const rel = path.relative(furnitureDir, filePath);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    const items: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
    let fileOk = true;
    items.forEach((item, idx) => {
      const result = FurnitureDefinition.safeParse(item);
      if (!result.success) {
        console.error(`\n❌ ${rel} [item ${idx}]:`);
        console.error(JSON.stringify(result.error.format(), null, 2));
        fileOk = false;
        success = false;
      }
    });
    if (fileOk) console.log(`✅ ${rel} (${items.length} item(s))`);
  } catch (e: unknown) {
    console.error(`\n❌ ${rel}: ${e instanceof Error ? e.message : String(e)}`);
    success = false;
  }
}

// --- Historical ---
const historicalDir = path.join(contentDir, 'historical');
const historicalFiles = getJsonFiles(historicalDir);
console.log(`\n[historical] ${historicalFiles.length} arquivo(s) encontrado(s)`);
for (const filePath of historicalFiles) {
  const rel = path.relative(historicalDir, filePath);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    const result = HistoricalFileSchema.safeParse(parsed);
    if (!result.success) {
      console.error(`\n❌ ${rel}:`);
      console.error(JSON.stringify(result.error.format(), null, 2));
      success = false;
    } else {
      console.log(`✅ ${rel} (${result.data.eventos.length} evento(s))`);
    }
  } catch (e: unknown) {
    console.error(`\n❌ ${rel}: ${e instanceof Error ? e.message : String(e)}`);
    success = false;
  }
}

// --- Locations ---
const locationsDir = path.join(contentDir, 'locations');
const locationFiles = getJsonFiles(locationsDir);
console.log(`\n[locations] ${locationFiles.length} arquivo(s) encontrado(s)`);
for (const filePath of locationFiles) {
  const rel = path.relative(locationsDir, filePath);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    const result = ComodoDefinition.safeParse(parsed);
    if (!result.success) {
      console.error(`\n❌ ${rel}:`);
      console.error(JSON.stringify(result.error.format(), null, 2));
      success = false;
    } else {
      console.log(`✅ ${rel}`);
    }
  } catch (e: unknown) {
    console.error(`\n❌ ${rel}: ${e instanceof Error ? e.message : String(e)}`);
    success = false;
  }
}

// --- Locations ISO ---
const locationsIsoDir = path.join(contentDir, 'locations-iso');
const locationsIsoFiles = getJsonFiles(locationsIsoDir);
console.log(`\n[locations-iso] ${locationsIsoFiles.length} arquivo(s) encontrado(s)`);
for (const filePath of locationsIsoFiles) {
  const rel = path.relative(locationsIsoDir, filePath);
  if (rel === 'index.json') continue;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    const result = IsoRoomDefinition.safeParse(parsed);
    if (!result.success) {
      console.error(`\n❌ ${rel}:`);
      console.error(JSON.stringify(result.error.format(), null, 2));
      success = false;
    } else {
      console.log(`✅ ${rel}`);
    }
  } catch (e: unknown) {
    console.error(`\n❌ ${rel}: ${e instanceof Error ? e.message : String(e)}`);
    success = false;
  }
}

if (!success) {
  console.log('\nAlgumas validações falharam.');
  process.exit(1);
} else {
  console.log('\nTodos os arquivos validados com sucesso! 🎉');
}
