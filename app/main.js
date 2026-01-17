// app/main.js
const root = document.getElementById('app');

function escapeHTML(s){
  return String(s ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;');
}

function showFatal(err){
  root.innerHTML = `
    <section style="padding:24px; line-height:1.6;">
      <div style="font-size:22px; font-weight:800; margin:0 0 10px;">啟動失敗</div>
      <div style="opacity:.85; white-space:pre-wrap;">${escapeHTML(err?.message || err)}</div>
      <div style="margin-top:12px; opacity:.7;">BUILD: 2026-01-17-EDITOR-V1</div>
    </section>
  `;
}

async function mountBookshelf(){
  const mod = await import('./features/bookshelf/bookshelf.logic.js');
  if (!mod.mountBookshelf) throw new Error('bookshelf.logic.js 缺少 mountBookshelf(root)');
  mod.mountBookshelf(root);
}

async function mountEditor(bookId){
  const mod = await import('./features/editor/editor.logic.js');
  if (!mod.mountEditor) throw new Error('editor.logic.js 缺少 mountEditor(root, bookId)');
  mod.mountEditor(root, bookId);
}

function parseHash(){
  // #/edit/<id>
  const h = (location.hash || '').replace(/^#/, '');
  const parts = h.split('/').filter(Boolean);
  if (parts[0] === 'edit' && parts[1]) return { page:'edit', id: parts[1] };
  return { page:'bookshelf' };
}

async function route(){
  try{
    // AI 模組不致命（可有可無）
    try {
      const ai = await import('./features/ai/ai.logic.js');
      if (ai?.mountAI) ai.mountAI({ btnSelector: '#btnAi' });
    } catch (e) {
      console.warn('AI module load skipped:', e);
    }

    const r = parseHash();
    if (r.page === 'edit') {
      await mountEditor(r.id);
    } else {
      await mountBookshelf();
    }
  } catch (err){
    showFatal(err);
  }
}

window.addEventListener('hashchange', route);
route();