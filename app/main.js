// app/main.js (stable)
import { mountBookshelf } from './features/bookshelf/bookshelf.logic.js';

const root = document.getElementById('app');

function boot(){
  if (!root) return;
  mountBookshelf(root);
}

boot();