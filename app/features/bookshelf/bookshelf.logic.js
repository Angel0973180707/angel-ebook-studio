// app/features/bookshelf/bookshelf.logic.js
import { bookshelfHTML } from './bookshelf.view.js';

const LS_KEY = 'angel_ebook_books_v1';

export function mountBookshelf(root) {
  if (!root) return;

  const state = { books: loadBooks() };
  root.innerHTML = bookshelfHTML({ books: state.books });

  root.onclick = (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;

    if (action === 'newBook') {
      const title = prompt('書名（可先空白）', '我的新書');
      const now = Date.now();
      state.books.unshift({
        id: String(now),
        title: (title ?? '').trim() || '（未命名）',
        status: 'draft',
        updatedAt: now
      });
      saveBooks(state.books);
      root.innerHTML = bookshelfHTML({ books: state.books });
      return;
    }

    const item = btn.closest('.bookItem');
    if (!item) return;
    const id = item.dataset.bookId;
    const idx = state.books.findIndex(b => String(b.id) === String(id));
    if (idx < 0) return;

    if (action === 'toggleStatus') {
      const b = state.books[idx];
      b.status = (b.status === 'published') ? 'draft' : 'published';
      b.updatedAt = Date.now();
      saveBooks(state.books);
      root.innerHTML = bookshelfHTML({ books: state.books });
      return;
    }

    if (action === 'delete') {
      const b = state.books[idx];
      const ok = confirm(`確定刪除「${b.title}」？`);
      if (!ok) return;
      state.books.splice(idx, 1);
      saveBooks(state.books);
      root.innerHTML = bookshelfHTML({ books: state.books });
      return;
    }

    if (action === 'open') {
      const b = state.books[idx];
      alert(`開啟：${b.title}\n（下一步接：章節/圖文編輯器）`);
      return;
    }
  };
}

function loadBooks() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBooks(books) {
  localStorage.setItem(LS_KEY, JSON.stringify(books));
}