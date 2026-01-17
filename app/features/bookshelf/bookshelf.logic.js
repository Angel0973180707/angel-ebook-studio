// app/features/bookshelf/bookshelf.logic.js
import { bookshelfHTML } from './bookshelf.view.js';

const LS_BOOKS = 'angel_ebook_books_v1';

function safeParse(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

function loadBooks() {
  return safeParse(localStorage.getItem(LS_BOOKS), []);
}

function saveBooks(list) {
  localStorage.setItem(LS_BOOKS, JSON.stringify(list));
}

function uid() {
  return 'b_' + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function mountBookshelf(root) {
  if (!root) return;

  const state = { books: loadBooks() };

  function render() {
    root.innerHTML = bookshelfHTML({ books: state.books });
  }

  function upsert(book) {
    const idx = state.books.findIndex(b => b.id === book.id);
    if (idx >= 0) state.books[idx] = book;
    else state.books.unshift(book);
    saveBooks(state.books);
    render();
  }

  function remove(id) {
    state.books = state.books.filter(b => b.id !== id);
    saveBooks(state.books);
    render();
  }

  render();

  root.onclick = (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;

    if (action === 'newBook') {
      const now = Date.now();
      const book = {
        id: uid(),
        title: '我的新書',
        status: 'draft',
        createdAt: now,
        updatedAt: now
      };
      upsert(book);
      // 新增後直接打開
      location.hash = `#/edit/${book.id}`;
      return;
    }

    const item = e.target.closest('.bookItem');
    const id = item?.dataset?.bookId;
    if (!id) return;

    const book = state.books.find(b => b.id === id);
    if (!book) return;

    if (action === 'toggleStatus') {
      const now = Date.now();
      upsert({
        ...book,
        status: book.status === 'published' ? 'draft' : 'published',
        updatedAt: now
      });
      return;
    }

    if (action === 'open') {
      location.hash = `#/edit/${id}`;
      return;
    }

    if (action === 'delete') {
      if (confirm('確定刪除此書？（本機資料會移除）')) remove(id);
      return;
    }
  };
}