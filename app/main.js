import { APP_VERSION } from './core/constants.js';
import { $, toast } from './core/utils.js';
import { mountBookshelf } from './features/bookshelf/bookshelf.logic.js';
import { mountEditor } from './features/editor/editor.logic.js';
import { mountAIDrawer, setAIDrawerContext } from './features/ai/ai.logic.js';

const root = $('#app');
const btnAi = $('#btnAi');
const btnHome = $('#btnHome');

// Global context bridge (editor tells AI which book/tab/text is active)
window.AES = {
  version: APP_VERSION,
  setAIContext: setAIDrawerContext
};

function route(){
  const h = location.hash || '#/books';
  const m = h.match(/^#\/edit\/([^/]+)$/);
  if(m) return { name: 'edit', id: m[1] };
  return { name: 'books' };
}

async function render(){
  const r = route();
  if(r.name === 'books'){
    btnHome.style.display = 'none';
    root.innerHTML = '';
    mountBookshelf(root);
    setAIDrawerContext(null); // no book
    return;
  }
  if(r.name === 'edit'){
    btnHome.style.display = 'inline-flex';
    root.innerHTML = '';
    mountEditor(root, r.id);
    return;
  }
}

btnAi.addEventListener('click', ()=>{
  mountAIDrawer();
  window.__AES_AI__.toggle(true);
});

btnHome.addEventListener('click', ()=>{
  location.hash = '#/books';
});

window.addEventListener('hashchange', render);

// SW
if('serviceWorker' in navigator){
  window.addEventListener('load', async ()=>{
    try{
      await navigator.serviceWorker.register('./sw.js');
    }catch(e){
      console.warn('SW register failed', e);
    }
  });
}

// First render
render();

// Dev helper
toast(`Ebook Studio ${APP_VERSION}`);
