// app/features/bookshelf/bookshelf.view.js

export function bookshelfHTML({ books = [] }) {
  const items = books.length
    ? books.map(b => `
      <article class="bookItem" data-book-id="${b.id}">
        <div class="bookMain">
          <div class="bookTitle">${escapeHTML(b.title || '（未命名）')}</div>
          <div class="bookMeta">
            <span class="pill ${b.status === 'published' ? 'ok' : ''}">
              ${b.status === 'published' ? '完稿' : '草稿'}
            </span>
            <span class="metaTxt">更新：${fmtTime(b.updatedAt)}</span>
          </div>
        </div>
        <div class="bookActions">
          <button class="btn small ghost" data-action="toggleStatus">切換狀態</button>
          <button class="btn small ghost" data-action="open">開啟</button>
          <button class="btn small danger" data-action="delete">刪除</button>
        </div>
      </article>
    `).join('')
    : `<div class="empty">
         <div class="emptyTitle">目前還沒有書</div>
         <div class="emptySub">先新增一本書，讓它慢慢長大。</div>
       </div>`;

  return `
    <section class="panel">
      <div class="panelHead">
        <div>
          <div class="h2">📚 書庫</div>
          <div class="sub">可多本｜草稿/完稿｜自動存放</div>
        </div>
        <div class="panelActions">
          <button class="btn" data-action="newBook">＋ 新增一本書</button>
        </div>
      </div>
      <div class="list">${items}</div>
    </section>
  `;
}

/** 兼容用：讓 logic 可以用 renderBookshelf() 這個更直覺的名字 */
export function renderBookshelf(books = []) {
  return bookshelfHTML({ books });
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

function escapeHTML(s){
  return String(s ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}