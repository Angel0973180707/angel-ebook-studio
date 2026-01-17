import { DB_NAME, DB_VERSION } from './constants.js';

let db;

export function initStore(){
  const req = indexedDB.open(DB_NAME, DB_VERSION);
  req.onupgradeneeded = e => {
    db = e.target.result;
    if(!db.objectStoreNames.contains('books')) db.createObjectStore('books', { keyPath:'id' });
    if(!db.objectStoreNames.contains('chapters')) db.createObjectStore('chapters', { keyPath:'id' });
    if(!db.objectStoreNames.contains('assets')) db.createObjectStore('assets', { keyPath:'id' });
    if(!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath:'id' });
  };
  req.onsuccess = e => { db = e.target.result; };
}
