// app/main.js
import { mountEditor } from './views/editor.js';
import { createStore } from './state/store.js';

const root = document.getElementById('app');
const toastEl = document.getElementById('toast');

function toast(msg){
  if(!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> toastEl.classList.remove('show'), 1800);
}

// Simple router: default to editor with a default book
const store = createStore();

function boot(){
  const hash = location.hash.slice(1);
  if(!hash){
    // ensure a default book exists
    let book = store.getActiveBook();
    if(!book){
      book = store.createBook('未命名書稿');
      store.setActiveBook(book.id);
    }
    mountEditor(root, { store, bookId: book.id, toast });
  }else{
    const m = new URLSearchParams(hash);
    const bookId = m.get('book');
    if(bookId && store.getBook(bookId)){
      mountEditor(root, { store, bookId, toast });
    }else{
      const book = store.getActiveBook() || store.createBook('未命名書稿');
      store.setActiveBook(book.id);
      mountEditor(root, { store, bookId: book.id, toast });
    }
  }
  bindSounddock();
}

function bindSounddock(){
  const buttons = Array.from(document.querySelectorAll('.soundbtn'));
  if(!buttons.length) return;

  const A = new Audio();
  A.loop = true;
  A.volume = 0.25;

  const key = 'angel_sound_v2';
  let state = null;
  try{ state = JSON.parse(localStorage.getItem(key) || 'null'); }catch(e){}

  function setPressed(mode){
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sound === mode && state?.playing)));
  }

  async function play(mode){
    try{
      const src = mode === 'night' ? 'assets/audio/night.mp3' : 'assets/audio/ocean.mp3';
      if(A.src !== new URL(src, location.href).href){
        A.pause();
        A.src = src;
      }
      await A.play();
      state = { mode, playing: true, vol: A.volume };
      localStorage.setItem(key, JSON.stringify(state));
      setPressed(mode);
    }catch(err){
      console.warn('Audio play blocked until user gesture.', err);
      toast('請再點一次播放');
    }
  }
  function pause(){
    A.pause();
    state = { ...(state||{}), playing:false };
    localStorage.setItem(key, JSON.stringify(state));
    setPressed(state?.mode || '');
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.sound;
      if(state?.playing && state?.mode === mode){
        pause();
      }else{
        play(mode);
      }
    });
  });

  if(state){
    setPressed(state.mode || '');
  }
}

boot();

window._angel = { store };
