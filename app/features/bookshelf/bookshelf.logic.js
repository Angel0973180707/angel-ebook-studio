// app/features/bookshelf/bookshelf.logic.js

import { bookshelfHTML } from './bookshelf.view.js';

const STORAGE_KEY = 'angel_ebook_books_v1';

function loadBooks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveBooks(books) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

function newId() {
  // 手機 Chrome 多數支援 crypto.randomUUID()
  try { return crypto.randomUUID(); }
  catch { return 'b_' + Date.now() + '_' + Math.random().toString(16).slice(2); }
}

export function mountBookshelf(root) {
  if (!root) return;

  let books = loadBooks();

  function render() {
    root.innerHTML = bookshelfHTML({ books });
  }

  function touch(book) {
    book.updatedAt = new Date().toISOString();
    return book;
  }

  render();

  root.onclick = (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const item = e.target.closest('.bookItem');
    const id = item?.dataset?.bookId; // 來自 view 的 data-book-id

    if (action === 'newBook') {
      const book = touch({
        id: newId(),
        title: '我的新書',
        status: 'draft', // 先跟 view 顯示「草稿」一致
        updatedAt: new Date().toISOString()
      });
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
        return touch({ ...b, status: next });
      });
      saveBooks(books);
      render();
      return;
    }

    if (action === 'delete') {
      books = books.filter(b => b.id !== id);
      saveBooks(books);
      render();
      return;
    }

    if (action === 'open') {
      // 先用最簡單：暫時用 alert 顯示（下一步我會帶你做「編輯器頁」）
      const b = books.find(x => x.id === id);
      alert(`開啟：${b?.title || '（未命名）'}\n\n下一步我們做：進入編輯器頁`);
      return;
    }
  };
}