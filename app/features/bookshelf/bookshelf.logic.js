// app/features/bookshelf/bookshelf.logic.js
import { bookshelfHTML } from './bookshelf.view.js';

const STORAGE_KEY = 'angel_ebook_books_v1';

function loadBooks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveBooks(books) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}
function newId() {
  try { return crypto.randomUUID(); }
  catch { return 'b_' + Date.now() + '_' + Math.random().toString(16).slice(2); }
}

export function mountBookshelf(root) {
  if (!root) return;

  let books = loadBooks();

  function render() {
    root.innerHTML = bookshelfHTML({ books });
  }

  render();

  root.onclick = (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const item = e.target.closest('.bookItem');
    const id = item?.dataset?.bookId;

    if (action === 'newBook') {
      const now = new Date().toISOString();
      const book = {
        id: newId(),
        title: '我的新書',
        status: 'draft',
        updatedAt: now,

        // editor v1 fields
        inspiration: '',
        draft: '',
        content: '',

        // editor v1: custom command library per-user (global), kept elsewhere
      };

      books = [book, ...books];
      saveBooks(books);
      render();
      return;
    }

    if (!id) return;

    if (action === 'toggleStatus') {
      books = books.map(b => {
        if (b.id !== id) return b;
        const next = (b.status === 'published') ? 'draft' : 'published';
        return { ...b, status: next, updatedAt: new Date().toISOString() };
      });
      saveBooks(books);
      render();
      return;
    }

    if (action === 'delete') {
      const b = books.find(x => x.id === id);
      const ok = confirm(`確定刪除「${b?.title || '（未命名）'}」？`);
      if (!ok) return;

      books = books.filter(b => b.id !== id);
      saveBooks(books);
      render();
      return;
    }

    if (action === 'open') {
      location.hash = `#/book/${encodeURIComponent(id)}`;
      return;
    }
  };
}