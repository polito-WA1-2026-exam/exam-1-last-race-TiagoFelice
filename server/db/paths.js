import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const dataDir = path.join(__dirname, '..', 'data');
export const dbPath = path.join(dataDir, 'last-race.sqlite');
export const schemaPath = path.join(__dirname, 'schema.sql');
