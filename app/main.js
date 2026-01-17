// app/main.js
import { mountBookshelf } from './features/bookshelf/bookshelf.logic.js';
import { mountEditor } from './features/editor/editor.logic.js';

const root = document.getElementById('app');

function route() {
  if (!root) return;

  const hash = location.hash || '#/bookshelf';

  const m = hash.match(/^#\/book\/(.+)$/);
  if (m) {
    const bookId = decodeURIComponent(m[1]);
    mountEditor(root, { bookId });
    return;
  }

  mountBookshelf(root);
}

window.addEventListener('hashchange', route);
route();