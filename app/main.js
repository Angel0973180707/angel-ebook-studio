// app/main.js
const root = document.getElementById('app');

function show(msg) {
  root.innerHTML = `
    <section style="padding:24px; line-height:1.6;">
      <div style="font-size:18px; font-weight:700; margin-bottom:10px;">Ebook Studio</div>
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
    show('載入書庫模組中…');

    // ✅ 這裡就是關鍵：確保路徑是 /features/bookshelf/（沒有 ai 那層）
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