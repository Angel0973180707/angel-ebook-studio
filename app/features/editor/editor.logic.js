// app/features/editor/editor.logic.js
import { editorHTML } from './editor.view.js';

const LS_BOOKS = 'angel_ebook_books_v1';
const LS_BOOKDATA_PREFIX = 'angel_ebook_bookdata_v1_'; // + bookId

function safeParse(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

function loadBooks() {
  return safeParse(localStorage.getItem(LS_BOOKS), []);
}

function saveBooks(list) {
  localStorage.setItem(LS_BOOKS, JSON.stringify(list));
}

function loadBookData(bookId) {
  return safeParse(localStorage.getItem(LS_BOOKDATA_PREFIX + bookId), {
    inspire: '',
    draft: '',
    final: ''
  });
}

function saveBookData(bookId, data) {
  localStorage.setItem(LS_BOOKDATA_PREFIX + bookId, JSON.stringify(data));
}

function now() { return Date.now(); }

export function mountEditor(root, { bookId }) {
  if (!root) return;

  let books = loadBooks();
  let book = books.find(b => b.id === bookId);

  // 若找不到書（例如被刪了），回書庫
  if (!book) {
    location.hash = '#/books';
    return;
  }

  let tab = 'draft';
  let data = loadBookData(bookId);
  let saveTimer = null;

  function render() {
    root.innerHTML = editorHTML({ book, tab });

    // 填入文字
    root.querySelector('[data-role="inspire"]').value = data.inspire || '';
    root.querySelector('[data-role="draft"]').value = data.draft || '';
    root.querySelector('[data-role="final"]').value = data.final || '';
  }

  function markSaved(msg = '已自動存放') {
    const el = root.querySelector('#edSaved');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('flash');
    clearTimeout(markSaved._t);
    markSaved._t = setTimeout(() => el.classList.remove('flash'), 450);
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveBookData(bookId, data);
      // 更新書的 updatedAt
      books = loadBooks();
      book = books.find(b => b.id === bookId) || book;
      const idx = books.findIndex(b => b.id === bookId);
      if (idx >= 0) {
        books[idx] = { ...books[idx], title: book.title, status: book.status, updatedAt: now() };
        saveBooks(books);
        book = books[idx];
      }
      markSaved('已自動存放（剛剛）');
    }, 350);
  }

  function exportJSON() {
    const payload = {
      meta: { app: 'Angel Ebook Studio', version: 'editor-v1', exportedAt: new Date().toISOString() },
      book,
      data
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(book.title || 'book').replaceAll(' ','_')}_${book.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 800);
  }

  function importJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      const obj = safeParse(text, null);
      if (!obj?.book?.id || !obj?.data) {
        alert('匯入失敗：格式不對（需要包含 book / data）');
        return;
      }
      // 匯入到「目前這本書」：只吃 data（避免覆蓋 id）
      data = {
        inspire: String(obj.data.inspire || ''),
        draft: String(obj.data.draft || ''),
        final: String(obj.data.final || '')
      };
      saveBookData(bookId, data);
      markSaved('已匯入並存放');
      render();
    };
    input.click();
  }

  function copyForAI() {
    const txt = data[tab] || '';
    const header = `【書名】${book.title}\n【區塊】${tab}\n\n`;
    copyText(header + txt);
    markSaved('已複製（貼到 AI）');
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  render();

  // 標題與三欄內容：輸入即自動存
  root.addEventListener('input', (e) => {
    const role = e.target?.dataset?.role;

    if (role === 'title') {
      book = { ...book, title: e.target.value || '（未命名）' };
      // 同步到 books
      const list = loadBooks();
      const idx = list.findIndex(b => b.id === bookId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], title: book.title, updatedAt: now() };
        saveBooks(list);
      }
      scheduleSave();
      return;
    }

    if (role === 'inspire' || role === 'draft' || role === 'final') {
      data = { ...data, [role]: e.target.value || '' };
      scheduleSave();
      return;
    }
  });

  // 點擊行為
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const act = btn.dataset.action;

    if (act === 'back') { location.hash = '#/books'; return; }

    if (act === 'tab') {
      tab = btn.dataset.tab || 'draft';
      render();
      return;
    }

    if (act === 'export') { exportJSON(); return; }
    if (act === 'import') { importJSON(); return; }
    if (act === 'copyForAI') { copyForAI(); return; }

    if (act === 'toggleStatus') {
      const list = loadBooks();
      const idx = list.findIndex(b => b.id === bookId);
      if (idx >= 0) {
        const next = list[idx].status === 'published' ? 'draft' : 'published';
        list[idx] = { ...list[idx], status: next, updatedAt: now() };
        saveBooks(list);
        book = list[idx];
        render();
        markSaved('狀態已更新');
      }
      return;
    }
  });
}