// app/main.js
const root = document.getElementById('app');

function show(msg) {
  root.innerHTML = `
    <section style="padding:24px; line-height:1.6;">
      <div style="font-size:18px; font-weight:700; margin-bottom:10px;">Angel Ebook Studio</div>
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

async function boot() {
  try {
    // 1) 先掛 AI 按鈕（不影響書庫）
    try {
      const ai = await import('./features/ai/ai.logic.js');
      if (ai?.mountAI) ai.mountAI({ btnSelector: '#btnAi' });
    } catch (e) {
      // AI 模組不致命，忽略即可
      console.warn('AI module load skipped:', e);
    }

    // 2) 再掛書庫
    show('載入書庫模組中…');
    const mod = await import('./features/bookshelf/bookshelf.logic.js');

    const keys = Object.keys(mod);
    if (!mod.mountBookshelf) {
      show(
        `bookshelf.logic.js 已載入，但找不到 mountBookshelf()\n\n` +
        `目前此 module 的 exports 有：\n- ${keys.join('\n- ')}\n\n` +
        `請確認：\n` +
        `1) 檔案路徑：app/features/bookshelf/bookshelf.logic.js\n` +
        `2) 檔案內有：export function mountBookshelf(root) { ... }`
      );
      return;
    }

    show('mountBookshelf() OK，開始掛載…');
    mod.mountBookshelf(root);

  } catch (err) {
    show(`啟動失敗：\n${err?.message || err}`);
  }
}

boot();