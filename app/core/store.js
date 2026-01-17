import { DB_NAME, DB_VERSION } from './constants.js';

let dbPromise = null;

export function initStore(){
  if(dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if(!db.objectStoreNames.contains('books')) db.createObjectStore('books', { keyPath:'id' });
      if(!db.objectStoreNames.contains('chapters')) db.createObjectStore('chapters', { keyPath:'id' });
      if(!db.objectStoreNames.contains('assets')) db.createObjectStore('assets', { keyPath:'id' });
      if(!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath:'id' });
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function withStore(storeName, mode, fn){
  const db = await initStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = fn(store);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getBooks(){
  return withStore('books', 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function saveBook(book){
  return withStore('books', 'readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const req = store.put(book);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function deleteBook(bookId){
  return withStore('books', 'readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const req = store.delete(bookId);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  });
}