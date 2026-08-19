import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  console.warn("Could not load firebase-applet-config.json");
}

const app = config ? initializeApp(config, "server-app") : null;
export const serverDb = app ? getFirestore(app, config.firestoreDatabaseId) : null;
