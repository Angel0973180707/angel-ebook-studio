import { initStore } from './core/store.js';
import { initAI } from './features/ai/ai.logic.js';

console.log('Angel Ebook Studio booting...');
initStore();
initAI();
