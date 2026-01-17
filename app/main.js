// app/main.js
import { Store } from './state/store.js';
import { renderBookshelf } from './views/bookshelf.js';
import { renderEditor } from './views/editor.js';

const root = document.getElementById('app');
const topSub = document.getElementById('topSub');
const btnAiTop = document.getElementById('btnAiTop');

const store = new Store();

function toast(msg){
  const el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 1400);
}

function setSub(txt){ if(topSub) topSub.textContent = txt; }

function parseRoute(){
  const h = location.hash || '#/bookshelf';
  const [path, qs] = h.split('?');
  const params = new URLSearchParams(qs || '');
  return { path, params };
}

function go(h){
  location.hash = h;
}

function ensureValidEditor(bookId){
  const b = store.getBook(bookId);
  if(!b){
    toast('這本書可能來自舊版本，已回到書庫。');
    go('#/bookshelf');
    return null;
  }
  return b;
}

function mount(){
  const { path, params } = parseRoute();

  if(path === '#/editor'){
    const id = params.get('id') || '';
    const tab = params.get('tab') || 'draft';
    const book = ensureValidEditor(id);
    if(!book) return;

    setSub('編輯');
    renderEditor({
      root,
      store,
      bookId: id,
      tab,
      onNavigate: (nextHash) => go(nextHash),
      onToast: toast
    });

    btnAiTop.onclick = () => {
      const cur = parseRoute();
      const curId = cur.params.get('id') || id;
      go(`#/editor?id=${encodeURIComponent(curId)}&tab=ai`);
    };
    return;
  }

  setSub('書庫');
  renderBookshelf({
    root,
    store,
    onOpen: (bookId) => go(`#/editor?id=${encodeURIComponent(bookId)}&tab=draft`),
    onToast: toast
  });

  btnAiTop.onclick = () => toast('請先開啟一本書，再使用 AI 協作。');
}

window.addEventListener('hashchange', mount);

window.addEventListener('load', async () => {
  try{
    if('serviceWorker' in navigator){
      await navigator.serviceWorker.register('./sw.js', { scope: './' });
    }
  }catch(e){}
  mount();
});
