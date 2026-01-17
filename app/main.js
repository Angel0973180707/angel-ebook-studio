// app/main.js
const root = document.getElementById('app');

function escapeHTML(s){
  return String(s ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;');
}

function show(title, msg) {
  root.innerHTML = `
    <section style="padding:18px 16px; line-height:1.6;">
      <div style="font-size:18px; font-weight:800; margin-bottom:10px;">${escapeHTML(title)}</div>
      <pre style="white-space:pre-wrap; opacity:.92;">${escapeHTML(msg)}</pre>
      <div style="margin-top:12px; opacity:.75; font-size:12px;">
        BUILD: 2026-01-17-1600
      </div>
    </section>
  `;
}

async function boot() {
  try {
    show('啟動中…', '正在載入 modules…');

    // 1) AI（可有可無）
    try {
      const ai = await import('./features/ai/ai.logic.js');
      if (ai?.mountAI) {
        ai.mountAI({ btnSelector: '#btnAi' });
      } else {
        console.warn('AI module loaded but mountAI not found');
      }
    } catch (e) {
      console.warn('AI module skipped:', e);
    }

    // 2) 書庫（必須）
    const bs = await import('./features/bookshelf/bookshelf.logic.js');

    if (!bs?.mountBookshelf) {
      const keys = Object.keys(bs || {});
      show(
        '書庫掛載失敗',
        `bookshelf.logic.js 已載入，但找不到 mountBookshelf()\n\nexports:\n- ${keys.join('\n- ')}\n\n請確認 bookshelf.logic.js 內有：\nexport function mountBookshelf(root) { ... }`
      );
      return;
    }

    // ✅ 正常：掛載書庫
    bs.mountBookshelf(root);

  } catch (err) {
    show('啟動失敗', err?.stack || err?.message || String(err));
  }
}

boot();