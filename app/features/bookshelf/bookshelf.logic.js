// app/features/bookshelf/bookshelf.logic.js
import { bookshelfHTML } from './bookshelf.view.js';

const LS_KEY = 'angel_ebook_books_v1';

export function mountBookshelf(root) {
  if (!root) return;

  const state = {
    books: loadBooks()
  };

  render(root, state);
  bind(root, state);
}

/* =========================
   Render
========================= */
function render(root, state) {
  root.innerHTML = bookshelfHTML({ books: state.books });
}

/* =========================
   Events (event delegation)
========================= */
function bind(root, state) {
  root.onclick = (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const action = btn.dataset.action;
    if (!action) return;

    // New book
    if (action === 'newBook') {
      const title = prompt('書名（可先空白）', '我的新書');
      const now = Date.now();
      const book = {
        id: String(now),
        title: (title ?? '').trim() || '（未命名）',
        status: 'draft',
        updatedAt: now,
        // 之後 editor 會用到
        cover: { title: '', subtitle: '', imageDataUrl: '' },
        chapters: []
      };
      state.books.unshift(book);
      persist(state);
      render(root, state);
      return;
    }

    // Item actions need book id
    const item = btn.closest('.bookItem');
    if (!item) return;
    const id = item.dataset.bookId;
    const idx = state.books.findIndex(b => String(b.id) === String(id));
    if (idx < 0) return;

    if (action === 'toggleStatus') {
      const b = state.books[idx];
      b.status = (b.status === 'published') ? 'draft' : 'published';
      b.updatedAt = Date.now();
      persist(state);
      render(root, state);
      return;
    }

    if (action === 'delete') {
      const b = state.books[idx];
      const ok = confirm(`確定刪除「${b.title}」？`);
      if (!ok) return;
      state.books.splice(idx, 1);
      persist(state);
      render(root, state);
      return;
    }

    if (action === 'open') {
      const b = state.books[idx];
      // 先佔位：下一步我們會做 editor，這裡會改成 openBook(id)
      alert(`開啟：${b.title}\n（下一步接：章節/內容編輯器）`);
      return;
    }
  };
}

/* =========================
   Storage
========================= */
function loadBooks() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(state) {
  localStorage.setItem(LS_KEY, JSON.stringify(state.books));
}