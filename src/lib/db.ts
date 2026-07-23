import fs from 'fs/promises';
import path from 'path';

export async function getDbConfig() {
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading db.json:', error);
    return null;
  }
}
