import fs from 'node:fs';
import sqlite3 from 'sqlite3';
import { dataDir, dbPath } from './paths.js';

fs.mkdirSync(dataDir, { recursive: true });

export const db = new sqlite3.Database(dbPath);

db.configure('busyTimeout', 5000);
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
});

export function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
