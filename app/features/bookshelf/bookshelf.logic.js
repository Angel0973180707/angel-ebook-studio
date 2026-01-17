// app/features/bookshelf/bookshelf.logic.js

import { bookshelfHTML } from './bookshelf.view.js';

const LS_KEY = 'angel_ebook_books_v1';

function safeJsonParse(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

function loadBooks() {
  const raw = localStorage.getItem(LS_KEY);
  const data = raw ? safeJsonParse(raw, []) : [];
  return Array.isArray(data) ? data : [];
}

function saveBooks(books) {
  localStorage.setItem(LS_KEY, JSON.stringify(books));
}

function newId() {
  return 'b_' + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function mountBookshelf(root) {
  if (!root) return;

  const state = { books: loadBooks() };

  function render() {
    // ✅ 重點：永遠把陣列丟進去
    root.innerHTML = bookshelfHTML({ books: state.books });
  }

  function commit() {
    saveBooks(state.books);
    render();
  }

  render();

  // 事件委派
  root.onclick = (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'newBook') {
      state.books.unshift({
        id: newId(),
        title: '我的新書',
        status: 'draft',
        updatedAt: Date.now()
      });
      commit();
      return;
    }

    const item = e.target.closest('.bookItem');
    const id = item?.dataset?.bookId;
    if (!id) return;

    const idx = state.books.findIndex(b => b.id === id);
    if (idx < 0) return;

    if (action === 'delete') {
      state.books.splice(idx, 1);
      commit();
      return;
    }

    if (action === 'toggleStatus') {
      const b = state.books[idx];
      b.status = (b.status === 'published') ? 'draft' : 'published';
      b.updatedAt = Date.now();
      commit();
      return;
    }

    if (action === 'open') {
      // v1：先用 alert 代替導頁（下一步我們做 Editor Page）
      alert('下一步：開啟編輯頁（Editor v1）');
      return;
    }
  };
}