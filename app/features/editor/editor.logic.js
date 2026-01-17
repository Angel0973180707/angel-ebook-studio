// app/features/editor/editor.logic.js
import { editorHTML } from './editor.view.js';

const LS_BOOKS = 'angel_ebook_books_v1';

function safeJsonParse(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

function loadBooks(){
  const raw = localStorage.getItem(LS_BOOKS);
  const data = raw ? safeJsonParse(raw, []) : [];
  return Array.isArray(data) ? data : [];
}

function saveBooks(books){
  localStorage.setItem(LS_BOOKS, JSON.stringify(books));
}

function now(){
  return Date.now();
}

function bookContentKey(id){
  return `angel_ebook_book_content_${id}_v1`;
}

function loadContent(id){
  const raw = localStorage.getItem(bookContentKey(id));
  const data = raw ? safeJsonParse(raw, {}) : {};
  return data && typeof data === 'object' ? data : {};
}

function saveContent(id, data){
  localStorage.setItem(bookContentKey(id), JSON.stringify(data || {}));
}

function downloadJSON(filename, obj){
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

export function mountEditor(root, bookId){
  if (!root) return;

  const books = loadBooks();
  const idx = books.findIndex(b => b.id === bookId);
  if (idx < 0) {
    root.innerHTML = `<section style="padding:24px;">找不到這本書（id：${bookId}）</section>`;
    return;
  }

  const state = {
    bookId,
    tab: 'draft',
    books,
    book: books[idx],
    content: loadContent(bookId)
  };

  function render(){
    root.innerHTML = editorHTML({
      title: state.book.title,
      status: state.book.status,
      tab: state.tab,
      data: state.content
    });
  }

  function commitBookMeta(){
    state.book.updatedAt = now();
    state.books[idx] = state.book;
    saveBooks(state.books);
  }

  function commitContent(){
    saveContent(bookId, state.content);
    commitBookMeta();
  }

  render();

  // 事件委派
  root.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('button[data-tab]');
    if (tabBtn){
      state.tab = tabBtn.dataset.tab;
      render();
      return;
    }

    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'back'){
      location.hash = '#/';
      return;
    }

    if (action === 'toggleStatus'){
      state.book.status = (state.book.status === 'published') ? 'draft' : 'published';
      commitBookMeta();
      render();
      return;
    }

    if (action === 'export'){
      const payload = {
        version: 'editor-v1',
        exportedAt: new Date().toISOString(),
        book: {
          id: state.book.id,
          title: state.book.title,
          status: state.book.status,
          updatedAt: state.book.updatedAt
        },
        content: state.content
      };
      const safeName = (state.book.title || 'my-book').replace(/[\\/:*?"<>|]/g, '_');
      downloadJSON(`angel-ebook-${safeName}.json`, payload);

      // ✅ 有支援就順便叫出分享（你可存雲端：Drive/Dropbox/Line/Email）
      if (navigator.share) {
        try {
          navigator.share({ title: 'Angel Ebook Export', text: '已匯出 JSON，請選擇要存到哪裡。' });
        } catch {}
      }
      return;
    }
  }, { passive:true });

  // 匯入（file input change）
  root.addEventListener('change', async (e) => {
    const input = e.target.closest('input[data-action="import"]');
    if (!input) return;
    const file = input.files?.[0];
    if (!file) return;

    try{
      const text = await file.text();
      const obj = safeJsonParse(text, null);
      if (!obj || typeof obj !== 'object') throw new Error('JSON 格式不正確');

      const incoming = obj.content && typeof obj.content === 'object' ? obj.content : {};
      state.content = {
        inspire: incoming.inspire || '',
        draft: incoming.draft || '',
        final: incoming.final || '',
        cmd: incoming.cmd || ''
      };

      // 也允許匯入時更新書名/狀態
      if (obj.book?.title) state.book.title = String(obj.book.title);
      if (obj.book?.status === 'published' || obj.book?.status === 'draft') state.book.status = obj.book.status;

      commitContent();
      render();
    } catch(err){
      alert('匯入失敗：' + (err?.message || err));
    } finally {
      input.value = '';
    }
  }, { passive:true });

  // 輸入即存：title + textarea
  let t = null;
  root.addEventListener('input', (e) => {
    const el = e.target;
    const field = el?.dataset?.field;
    if (!field) return;

    if (field === 'title'){
      state.book.title = el.value || '';
    } else {
      state.content[field] = el.value || '';
    }

    clearTimeout(t);
    t = setTimeout(() => {
      commitContent();
    }, 250);
  }, { passive:true });
}