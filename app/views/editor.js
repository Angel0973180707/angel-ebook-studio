// app/views/editor.js
function escapeHTML(s){
  return String(s ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

function downloadJSON(obj, filename){
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    return true;
  }catch(e){
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

function debounce(fn, ms=350){
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function tabLabel(tab){
  return tab === 'inspiration' ? '靈感' :
         tab === 'draft' ? '草稿' :
         tab === 'final' ? '完稿' :
         tab === 'ai' ? 'AI 協作' : '草稿';
}

function tabPlaceholder(tab){
  if(tab === 'inspiration') return '把任何靈感先放在這裡，它們不用立刻有秩序。';
  if(tab === 'draft') return '先寫順，不用修。讓文字先出來。';
  if(tab === 'final') return '把草稿整理成書稿段落：短段、留白、讀得下去。';
  return '';
}

function getFieldByTab(tab){
  return tab === 'inspiration' ? 'inspiration'
       : tab === 'final' ? 'final'
       : tab === 'ai' ? 'aiNotes'
       : 'draft';
}

export function renderEditor({ root, store, bookId, tab='draft', onNavigate, onToast }){
  const book = store.getBook(bookId);
  if(!book){
    root.innerHTML = `<section class="panel"><div class="empty"><div class="emptyTitle">找不到這本書</div><div class="emptySub">請回到書庫重新開啟。</div></div></section>`;
    return;
  }

  const activeTab = ['inspiration','draft','final','ai'].includes(tab) ? tab : 'draft';
  const field = getFieldByTab(activeTab);

  root.innerHTML = `
    <section class="panel">
      <div class="editorTop">
        <div class="editorTitleWrap">
          <input class="editorTitle" id="bookTitle" value="${escapeHTML(book.title || '')}" placeholder="輸入書名…" />
          <div class="editorRow">
            <button class="pill ${book.status==='published'?'ok':''}" id="btnStatus" type="button">
              ${book.status==='published'?'完稿':'草稿'} ▾
            </button>
            <span class="subtxt">分頁：${tabLabel(activeTab)}</span>
          </div>
        </div>
        <div>
          <button class="btn ghost" id="btnBack" type="button">回書庫</button>
        </div>
      </div>

      <div class="tabs" role="tablist" aria-label="Editor tabs">
        <button class="tab ${activeTab==='inspiration'?'active':''}" data-tab="inspiration" type="button">靈感</button>
        <button class="tab ${activeTab==='draft'?'active':''}" data-tab="draft" type="button">草稿</button>
        <button class="tab ${activeTab==='final'?'active':''}" data-tab="final" type="button">完稿</button>
        <button class="tab ${activeTab==='ai'?'active':''}" data-tab="ai" type="button">AI 協作</button>
      </div>

      <div class="editorBody" id="editorBody"></div>
    </section>

    <div class="footerBar">
      <div class="footerLeft">
        <button class="btn small" id="btnImport" type="button">匯入</button>
        <button class="btn small" id="btnExport" type="button">匯出</button>
      </div>
      <div class="footerRight" id="saveHint">已自動存放</div>
    </div>
  `;

  const body = root.querySelector('#editorBody');
  const saveHint = root.querySelector('#saveHint');

  const renderTextArea = () => {
    body.innerHTML = `
      <textarea class="textarea" id="textArea" placeholder="${escapeHTML(tabPlaceholder(activeTab))}">${escapeHTML(book[field] || '')}</textarea>
    `;
  };

  const renderAI = () => {
    const cmds = store.listCmds();
    const cards = cmds.map(c => `
      <div class="aiCard" data-cmd-id="${c.id}">
        <div class="aiCardTitle">${escapeHTML(c.title)}</div>
        <div class="aiCardSub">${escapeHTML(c.hint || '')}</div>
        <div class="aiCardActions">
          <button class="btn small primary" data-act="copyCmd" type="button">一鍵複製指令</button>
          <button class="btn small ghost" data-act="saveNote" type="button">存到本書指派</button>
        </div>
      </div>
    `).join('');

    body.innerHTML = `
      <div class="aiGrid">${cards}</div>
      <div style="height:10px"></div>
      <div class="aiCard">
        <div class="aiCardTitle">本書 AI 指派（可自行改）</div>
        <div class="aiCardSub">這裡放你臨時指派、待辦、或你要貼給 AI 的工作指令。會跟著這本書保存。</div>
        <div style="margin-top:10px;">
          <textarea class="textarea" id="aiNotes" placeholder="例如：把第三章改成更有留白、加上微科學但不炫技…">${escapeHTML(book.aiNotes || '')}</textarea>
        </div>
        <div class="aiCardActions">
          <button class="btn small primary" id="btnCopyNotes" type="button">複製本書指派</button>
        </div>
      </div>
    `;
  };

  if(activeTab === 'ai') renderAI();
  else renderTextArea();

  const titleEl = root.querySelector('#bookTitle');
  titleEl.addEventListener('input', debounce(() => {
    store.updateBook(bookId, { title: titleEl.value.trim() || '未命名的書' });
    saveHint.textContent = '已自動存放';
  }, 250));

  root.querySelector('#btnStatus').addEventListener('click', () => {
    store.toggleStatus(bookId);
    onToast?.('已切換狀態');
    onNavigate?.(`#/editor?id=${encodeURIComponent(bookId)}&tab=${encodeURIComponent(activeTab)}`);
  });

  root.querySelector('#btnBack').addEventListener('click', () => onNavigate?.('#/bookshelf'));

  root.querySelector('.tabs').addEventListener('click', (e) => {
    const t = e.target?.closest('button[data-tab]');
    if(!t) return;
    const next = t.getAttribute('data-tab');
    onNavigate?.(`#/editor?id=${encodeURIComponent(bookId)}&tab=${encodeURIComponent(next)}`);
  });

  const attachTextareaAutosave = (selector, fieldName) => {
    const ta = root.querySelector(selector);
    if(!ta) return;
    const save = debounce(() => {
      store.updateBook(bookId, { [fieldName]: ta.value });
      saveHint.textContent = '已自動存放';
    }, 350);
    ta.addEventListener('input', () => {
      saveHint.textContent = '存放中…';
      save();
    });
  };

  if(activeTab === 'ai'){
    attachTextareaAutosave('#aiNotes', 'aiNotes');

    body.addEventListener('click', async (e) => {
      const btn = e.target?.closest('button[data-act]');
      if(!btn) return;
      const card = btn.closest('.aiCard[data-cmd-id]');
      if(!card) return;
      const cmdId = card.getAttribute('data-cmd-id');
      const cmd = store.listCmds().find(x => x.id === cmdId);
      if(!cmd) return;

      const act = btn.getAttribute('data-act');
      const content = (store.getBook(bookId)?.draft || '').trim();
      const merged = (cmd.template || '').replaceAll('{{CONTENT}}', content || '（請在草稿分頁貼上內容後再使用）');

      if(act === 'copyCmd'){
        const ok = await copyText(merged);
        onToast?.(ok ? '已複製指令' : '複製失敗');
      }
      if(act === 'saveNote'){
        const b = store.getBook(bookId);
        const next = (b?.aiNotes || '').trim();
        const sep = next ? '\n\n---\n\n' : '';
        store.updateBook(bookId, { aiNotes: `${next}${sep}${merged}` });
        onToast?.('已存到本書指派');
        onNavigate?.(`#/editor?id=${encodeURIComponent(bookId)}&tab=ai`);
      }
    });

    root.querySelector('#btnCopyNotes')?.addEventListener('click', async () => {
      const b = store.getBook(bookId);
      const ok = await copyText(b?.aiNotes || '');
      onToast?.(ok ? '已複製本書指派' : '複製失敗');
    });

  }else{
    attachTextareaAutosave('#textArea', field);
  }

  // import/export
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/json';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  root.querySelector('#btnExport').addEventListener('click', () => {
    const obj = store.exportBook(bookId);
    if(!obj) return;
    const safeTitle = (store.getBook(bookId)?.title || 'book').replace(/[\\/:*?"<>|]/g,'_').slice(0,40);
    downloadJSON(obj, `angel-book-${safeTitle}.json`);
    onToast?.('已匯出 JSON');
  });

  root.querySelector('#btnImport').addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.onchange = async () => {
    const f = fileInput.files?.[0];
    if(!f) return;
    try{
      const txt = await f.text();
      const obj = JSON.parse(txt);
      const res = store.importBook(obj);
      if(!res.ok){
        onToast?.(res.msg || '匯入失敗');
        return;
      }
      onToast?.('已匯入一本書');
      onNavigate?.(`#/editor?id=${encodeURIComponent(res.id)}&tab=draft`);
    }catch(e){
      onToast?.('匯入失敗：檔案無法讀取');
    }
  };
}
