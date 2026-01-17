import { LS_KEYS } from './constants.js';

function safeParse(str, fallback){
  try{ return JSON.parse(str); }catch{ return fallback; }
}

export function loadJSON(key, fallback){
  return safeParse(localStorage.getItem(key) || '', fallback);
}

export function saveJSON(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadBooks(){
  return loadJSON(LS_KEYS.BOOKS, []);
}

export function saveBooks(books){
  saveJSON(LS_KEYS.BOOKS, books);
}

export function loadBookContent(id){
  return loadJSON(LS_KEYS.BOOK_CONTENT(id), {
    inspiration: '',
    draft: '',
    final: ''
  });
}

export function saveBookContent(id, content){
  saveJSON(LS_KEYS.BOOK_CONTENT(id), content);
}

export function loadAITemp(id){
  return loadJSON(LS_KEYS.AI_TEMP(id), []);
}

export function saveAITemp(id, items){
  saveJSON(LS_KEYS.AI_TEMP(id), items);
}

export function loadAILibrary(){
  // global reusable commands
  return loadJSON(LS_KEYS.AI_LIBRARY, {
    pinned: ['speech_to_book_no_ai'],
    items: {
      speech_to_book_no_ai: {
        id: 'speech_to_book_no_ai',
        title: '口說稿 → 電子書書稿（去 AI 感）',
        body:
`請把以下「口說稿」整理為電子書書稿章節，不是口說稿。\n\n轉換原則：\n1) 去除口語填充、即時提問與對話感\n2) 增加段落與留白，讓閱讀節奏變慢\n3) 不照原順序逐句轉寫，而是重組為清楚的書稿結構\n4) 每章包含：開場感受／理解鋪陳／一個轉彎洞見／溫柔收束（不說教、不給指令）\n5) 刻意避免『以下將說明』『這代表』等說明性語句；不要總結\n\n以下是口說稿：\n`
      }
    }
  });
}

export function saveAILibrary(lib){
  saveJSON(LS_KEYS.AI_LIBRARY, lib);
}

export function loadUIPref(){
  return loadJSON(LS_KEYS.UI_PREF, {});
}

export function saveUIPref(pref){
  saveJSON(LS_KEYS.UI_PREF, pref);
}
