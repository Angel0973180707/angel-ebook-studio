import { initStore } from './core/store.js';
import { initAI } from './features/ai/ai.logic.js';
import { mountBookshelf } from './features/bookshelf/bookshelf.logic.js';

function boot(){
  const app = document.getElementById('app');
  if(!app) return;

  initStore();
  initAI();
  mountBookshelf(app);
}

boot();