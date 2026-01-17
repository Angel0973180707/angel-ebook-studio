// app/main.js (debug bootstrap)
// 目的：任何 import 出錯，都直接顯示在畫面上（手機也看得到）

function esc(s){
  return String(s ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;');
}

function render(app, html){
  app.innerHTML = html;
}

function errorBox(title, err, hint){
  const msg = err?.message || String(err);
  return `
    <section style="padding:16px;line-height:1.5">
      <div style="font-size:18px;font-weight:800;margin-bottom:8px;">⚠️ ${esc(title)}</div>
      <pre style="white-space:pre-wrap;background:rgba(0,0,0,.25);padding:12px;border-radius:12px;overflow:auto">${esc(msg)}</pre>
      ${hint ? `<div style="margin-top:10px;opacity:.9">${hint}</div>` : ''}
      <div style="margin-top:14px;opacity:.8;font-size:13px">
        這個錯誤是「import 找不到檔案 / 路徑不對」最常見。請把上面訊息截圖給我，我就能一槍命中。
      </div>
    </section>
  `;
}

async function safeImport(path){
  // 動態 import，讓錯誤可被捕捉並顯示
  return await import(path);
}

async function boot(){
  const app = document.getElementById('app');
  if(!app) return;

  render(app, `<div style="padding:16px;opacity:.85">Loading modules...</div>`);

  // 1) store
  let store;
  try{
    store = await safeImport('./core/store.js');
    store.initStore();
  }catch(e){
    render(app, errorBox(
      '載入失敗：core/store.js',
      e,
      `請確認檔案存在：<b>app/core/store.js</b><br>並且它 import 的 constants.js 是否存在：<b>app/core/constants.js</b>`
    ));
    return;
  }

  // 2) AI
  try{
    const ai = await safeImport('./features/ai/ai.logic.js');
    if(ai.initAI) ai.initAI();
  }catch(e){
    render(app, errorBox(
      '載入失敗：features/ai/ai.logic.js',
      e,
      `請確認檔案存在：<b>app/features/ai/ai.logic.js</b><br>以及 ai.logic.js 內部 import 的檔案路徑都存在`
    ));
    return;
  }

  // 3) Bookshelf
  try{
    const bs = await safeImport('./features/bookshelf/bookshelf.logic.js');
    if(bs.mountBookshelf) bs.mountBookshelf(app);
    else render(app, `<div style="padding:16px">bookshelf.logic.js 已載入，但找不到 mountBookshelf()</div>`);
  }catch(e){
    render(app, errorBox(
      '載入失敗：features/bookshelf/bookshelf.logic.js',
      e,
      `請確認這兩個檔案存在：<br>
       • <b>app/features/bookshelf/bookshelf.logic.js</b><br>
       • <b>app/features/bookshelf/bookshelf.view.js</b><br>
       並且資料夾名稱是 <b>bookshelf</b>（全小寫）`
    ));
    return;
  }
}

boot();