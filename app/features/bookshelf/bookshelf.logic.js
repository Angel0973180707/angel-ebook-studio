// app/features/bookshelf/bookshelf.logic.js

import { renderBookshelf } from './bookshelf.view.js';

/**
 * 系統入口：掛載書庫
 * main.js 會找這個函式
 */
export function mountBookshelf(container) {
  if (!container) {
    console.warn('[bookshelf] container not found');
    return;
  }

  const state = loadBooks();
  container.innerHTML = renderBookshelf(state);

  bindEvents(container, state);
}

/* =========================
   資料層
========================= */

function loadBooks() {
  try {
    return JSON.parse(localStorage.getItem('angel_bookshelf')) || [];
  } catch {
    return [];
  }
}

function saveBooks(books) {
  localStorage.setItem('angel_bookshelf', JSON.stringify(books));
}

/* =========================
   行為綁定
========================= */

function bindEvents(container, books) {
  const addBtn = container.querySelector('[data-add-book]');
  if (!addBtn) return;

  addBtn.addEventListener('click', () => {
    const title = prompt('書名');
    if (!title) return;

    books.push({
      id: Date.now(),
      title,
      chapters: []
    });

    saveBooks(books);
    container.innerHTML = renderBookshelf(books);
    bindEvents(container, books);
  });
}