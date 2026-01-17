// app/main.js
const root = document.getElementById('app');

function show(msg) {
  root.innerHTML = `
    <section style="padding:24px; line-height:1.6;">
      <div style="font-size:18px; font-weight:800; margin-bottom:10px;">Angel Ebook Studio</div>
      <pre style="white-space:pre-wrap; opacity:.9;">${escapeHTML(msg)}</pre>
    </section>
  `;
}

function escapeHTML(s){
  return String(s ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;');
}

async function mountAIButton() {
  try {
    const ai = await import('./features/ai/ai.logic.js');
    if (ai?.mountAI) ai.mountAI({ btnSelector: '#btnAi' });
  } catch (e) {
    console.warn('AI module skipped:', e);
  }
}

function parseHash() {
  const raw = (location.hash || '').replace(/^#/, '').trim();
  // routes:
  // #/books
  // #/edit/<bookId>
  if (!raw || raw === '/' || raw === 'books') return { name: 'books' };
  const parts = raw.split('/').filter(Boolean);
  if (parts[0] === 'edit' && parts[1]) return { name: 'edit', bookId: parts[1] };
  if (parts[0] === 'books') return { name: 'books' };
  return { name: 'books' };
}

async function route() {
  const r = parseHash();

  try {
    if (r.name === 'books') {
      show('載入書庫中…');
      const mod = await import('./features/bookshelf/bookshelf.logic.js');
      if (!mod?.mountBookshelf) {
        show('找不到 mountBookshelf()，請確認 bookshelf.logic.js export 正確。');
        return;
      }
      mod.mountBookshelf(root);
      return;
    }

    if (r.name === 'edit') {
      show('載入編輯器中…');
      const mod = await import('./features/editor/editor.logic.js');
      if (!mod?.mountEditor) {
        show('找不到 mountEditor()，請確認 editor.logic.js export 正確。');
        return;
      }
      mod.mountEditor(root, { bookId: r.bookId });
      return;
    }

  } catch (err) {
    show(`啟動失敗：\n${err?.message || err}`);
  }
}

async function boot() {
  await mountAIButton();
  if (!location.hash) location.hash = '#/books';
  window.addEventListener('hashchange', route);
  route();
}

boot();