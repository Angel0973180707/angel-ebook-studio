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
    const id = btn.dataset.id;

    if (action === 'add') {
      books.unshift({
        id: crypto.randomUUID(),
        title: '我的新書',
        status: 'draft',
        updatedAt: new Date().toISOString()
      });
      saveBooks(books);
      render();
    }

    if (action === 'toggle') {
      books = books.map(b =>
        b.id === id
          ? { ...b, status: b.status === 'draft' ? 'done' : 'draft' }
          : b
      );
      saveBooks(books);
      render();
    }

    if (action === 'delete') {
      books = books.filter(b => b.id !== id);
      saveBooks(books);
      render();
    }
  };
}