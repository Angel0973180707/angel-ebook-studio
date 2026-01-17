// app/views/bookshelf.js
function escapeHTML(s){
  return String(s ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

function fmtTime(ts){
  const d = new Date(ts || Date.now());
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return `${y}-${m}-${dd} ${hh}:${mm}`;
}

export function renderBookshelf({ root, store, onOpen, onToast }){
  const books = store.listBooks();

  const items = books.length
    ? books.map(b => `
      <div class="card" data-id="${b.id}">
        <div class="cardMain">
          <div class="cardTitle">${escapeHTML(b.title || '（未命名）')}</div>
          <div class="cardMeta">
            <span class="pill ${b.status === 'published' ? 'ok' : ''}">${b.status === 'published' ? '完稿' : '草稿'}</span>
            <span>更新：${fmtTime(b.updatedAt)}</span>
          </div>
        </div>
        <div class="cardActions">
          <button class="btn small primary" data-act="open" type="button">開啟編輯</button>
          <button class="btn small ghost" data-act="more" type="button">⋯</button>
        </div>
      </div>
    `).join('')
    : `<div class="empty">
         <div class="emptyTitle">目前還沒有書</div>
         <div class="emptySub">先新增一本書，讓它慢慢長大。</div>
       </div>`;

  root.innerHTML = `
    <section class="panel">
      <div class="panelHead">
        <div>
          <div class="h2">📚 書庫</div>
          <div class="subtxt">多本管理｜草稿/完稿｜自動存放（本機）</div>
        </div>
        <div>
          <button class="btn primary" id="btnNewBook" type="button">＋ 新增一本書</button>
        </div>
      </div>
      <div class="list">${items}</div>
    </section>
  `;

  root.querySelector('#btnNewBook')?.addEventListener('click', () => {
    const id = store.createBook();
    onToast?.('已新增一本書');
    onOpen?.(id);
  });

  root.querySelector('.list')?.addEventListener('click', (e) => {
    const btn = e.target?.closest('button[data-act]');
    if(!btn) return;
    const card = btn.closest('.card');
    const id = card?.getAttribute('data-id');
    if(!id) return;

    const act = btn.getAttribute('data-act');
    if(act === 'open'){
      onOpen?.(id);
      return;
    }
    if(act === 'more'){
      const b = store.getBook(id);
      if(!b) return;
      const next = (b.status === 'published') ? '草稿' : '完稿';
      const ok = confirm(`更多操作：\n\n按「確定」切換為「${next}」\n按「取消」進入刪除確認。`);
      if(ok){
        store.toggleStatus(id);
        onToast?.('已切換狀態');
        renderBookshelf({ root, store, onOpen, onToast });
      }else{
        const del = confirm('確定要刪除？（刪除後無法復原）');
        if(del){
          store.deleteBook(id);
          onToast?.('已刪除');
          renderBookshelf({ root, store, onOpen, onToast });
        }
      }
    }
  });
}
