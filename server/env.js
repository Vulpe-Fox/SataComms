// This file reads the settings in the .env file in the project folder, if the file is there.
// The variables in the real environment replace the settings in .env.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
try {
  process.loadEnvFile(file);
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}
