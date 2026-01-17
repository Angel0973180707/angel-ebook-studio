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
    const groups = store.listCmdGroups();
    const pins = store.listPins();
    const all = store.listAllCmds();

    const getCmd = (id) => all.find(c => c.id === id) || null;
    const pinned = pins.map(getCmd).filter(Boolean);
    const quickGroup = groups.find(g => g.id === 'quick');

    const cardHTML = (c, extra='') => `
      <div class="aiCard" data-cmd-id="${escapeHTML(c.id)}" data-source="${escapeHTML(c._source||'builtin')}">
        <div class="aiCardTop">
          <div>
            <div class="aiCardTitle">${escapeHTML(c.title || '')}</div>
            <div class="aiCardSub">${escapeHTML(c.hint || '')}</div>
          </div>
          <button class="pinBtn ${store.isPinned(c.id)?'on':''}" data-act="pin" type="button" title="釘選">★</button>
        </div>
        <div class="aiCardActions">
          <button class="btn small" data-act="preview" type="button">預覽</button>
          <button class="btn small primary" data-act="copy" type="button">複製</button>
          <button class="btn small ghost" data-act="saveNote" type="button">存到本書指派</button>
          ${c._source==='mine' ? '<button class="btn small danger" data-act="deleteMy" type="button">刪除</button>' : ''}
        </div>
        ${extra}
      </div>
    `;

    const pinnedHTML = pinned.length
      ? pinned.map(c => cardHTML(c, '<div class="tagRow"><span class="tag">已釘選</span></div>')).join('')
      : `<div class="empty"><div class="emptyTitle">尚未釘選</div><div class="emptySub">把常用指令釘起來（最多 7 條）。</div></div>`;

    const quickHTML = quickGroup
      ? quickGroup.items.map(c => cardHTML(c)).join('')
      : '';

    const accordionHTML = groups
      .filter(g => g.id !== 'quick' && g.id !== 'mine')
      .map(g => {
        const items = g.items.map(c => cardHTML(c)).join('');
        return `
          <details class="acc" ${g.id==='structure' ? 'open' : ''}>
            <summary>
              <span class="accTitle">${escapeHTML(g.title)}</span>
              <span class="accHint">點開看指令</span>
            </summary>
            <div class="accBody">${items}</div>
          </details>
        `;
      }).join('');

    const myList = store.listMyCmds();
    const myHTML = myList.length
      ? myList.map(c => cardHTML({ ...c, _source:'mine' })).join('')
      : `<div class="empty"><div class="emptyTitle">還沒有我的指令</div><div class="emptySub">你可以把臨時指派存成「我的指令」。</div></div>`;

    body.innerHTML = `
      <div class="aiLayout">
        <section class="aiCol">
          <div class="panelBlock">
            <div class="panelBlockHead">
              <div>
                <div class="h3">★ 釘選</div>
                <div class="sub">最多 7 條，給自己一個順手的工作台。</div>
              </div>
            </div>
            <div class="aiGrid">${pinnedHTML}</div>
          </div>

          <div class="panelBlock">
            <div class="panelBlockHead">
              <div>
                <div class="h3">快速指令</div>
                <div class="sub">最常用的 5 條，先放上來。</div>
              </div>
            </div>
            <div class="aiGrid">${quickHTML}</div>
          </div>

          <div class="panelBlock">
            <div class="panelBlockHead">
              <div>
                <div class="h3">指令庫</div>
                <div class="sub">哲思／科學／教養／舒發／工具… 你要哪個角度就打開哪個。</div>
              </div>
              <div class="panelBlockActions">
                <button class="btn small" id="btnExportAi" type="button">匯出指令庫</button>
                <button class="btn small" id="btnImportAi" type="button">匯入指令庫</button>
              </div>
            </div>
            ${accordionHTML}
          </div>

          <div class="panelBlock">
            <div class="panelBlockHead">
              <div>
                <div class="h3">我的指令</div>
                <div class="sub">你臨時指派的好句子，值得留下來。</div>
              </div>
            </div>
            <div class="myCmdForm">
              <input class="input" id="myTitle" placeholder="指令標題（例：第八章改成書稿）」 />
              <input class="input" id="myHint" placeholder="一句提示（可空白）」 />
              <textarea class="textarea" id="myPrompt" placeholder="貼上你要留存的指令內容…"></textarea>
              <div class="rowEnd">
                <button class="btn small" id="btnSaveMy" type="button">存成我的指令</button>
                <button class="btn small ghost" id="btnClearMy" type="button">清空</button>
              </div>
            </div>
            <div class="aiGrid">${myHTML}</div>
          </div>
        </section>

        <aside class="aiSide">
          <div class="panelBlock sticky">
            <div class="panelBlockHead">
              <div>
                <div class="h3">指令預覽</div>
                <div class="sub">點「預覽」會把草稿自動帶入。</div>
              </div>
              <div class="panelBlockActions">
                <button class="btn small primary" id="btnCopyPreview" type="button">複製預覽</button>
              </div>
            </div>
            <textarea class="textarea" id="aiPreview" placeholder="在左邊選一條指令，這裡會出現完整內容…"></textarea>
            <div class="miniSub">會優先帶入「草稿」分頁的內容（若空白就提示你先貼內容）。</div>
          </div>

          <div class="panelBlock">
            <div class="panelBlockHead">
              <div>
                <div class="h3">本書指派</div>
                <div class="sub">臨時待辦／協作指令／你要貼給 AI 的工作內容（會跟著這本書保存）。</div>
              </div>
              <div class="panelBlockActions">
                <button class="btn small" id="btnAppendPreview" type="button">把預覽加進來</button>
                <button class="btn small primary" id="btnCopyNotes" type="button">複製本書指派</button>
              </div>
            </div>
            <textarea class="textarea" id="aiNotes" placeholder="例如：把第三章改成更有留白、加上微科學但不炫技…">${escapeHTML(book.aiNotes || '')}</textarea>
          </div>
        </aside>
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

    const previewEl = () => root.querySelector('#aiPreview');

    const buildMerged = (cmd) => {
      const b = store.getBook(bookId);
      const content = (b?.draft || '').trim() || '（請先到「草稿」分頁貼上內容）';
      const base = String(cmd.prompt || cmd.template || '').trim();
      if(base.includes('{{CONTENT}}')) return base.replaceAll('{{CONTENT}}', content);
      return `${base}\n\n${content}`;
    };

    const setPreview = (text) => {
      const el = previewEl();
      if(!el) return;
      el.value = text;
      el.scrollTop = 0;
    };

    body.addEventListener('click', async (e) => {
      const btn = e.target?.closest('button[data-act]');
      if(!btn) return;
      const card = btn.closest('.aiCard[data-cmd-id]');
      if(!card) return;
      const cmdId = card.getAttribute('data-cmd-id');
      const cmd = store.listAllCmds().find(x => x.id === cmdId);
      if(!cmd) return;

      const act = btn.getAttribute('data-act');

      if(act === 'pin'){
        const res = store.togglePin(cmdId);
        if(!res.ok){ onToast?.(res.msg || '釘選失敗'); return; }
        onToast?.(res.pinned ? '已釘選' : '已取消釘選');
        onNavigate?.(`#/editor?id=${encodeURIComponent(bookId)}&tab=ai`);
        return;
      }

      const merged = buildMerged(cmd);

      if(act === 'preview'){
        setPreview(merged);
        onToast?.('已更新預覽');
        return;
      }

      if(act === 'copy'){
        const ok = await copyText(merged);
        onToast?.(ok ? '已複製' : '複製失敗');
        return;
      }

      if(act === 'saveNote'){
        const b = store.getBook(bookId);
        const next = (b?.aiNotes || '').trim();
        const sep = next ? '\n\n---\n\n' : '';
        store.updateBook(bookId, { aiNotes: `${next}${sep}${merged}` });
        onToast?.('已存到本書指派');
        onNavigate?.(`#/editor?id=${encodeURIComponent(bookId)}&tab=ai`);
        return;
      }

      if(act === 'deleteMy'){
        store.deleteMyCmd(cmdId);
        onToast?.('已刪除');
        onNavigate?.(`#/editor?id=${encodeURIComponent(bookId)}&tab=ai`);
        return;
      }
    });

    // Save My Command
    root.querySelector('#btnSaveMy')?.addEventListener('click', () => {
      const title = root.querySelector('#myTitle')?.value || '';
      const hint = root.querySelector('#myHint')?.value || '';
      const prompt = root.querySelector('#myPrompt')?.value || '';
      const res = store.addMyCmd({ title, hint, prompt });
      if(!res.ok){ onToast?.(res.msg || '儲存失敗'); return; }
      onToast?.('已存成我的指令');
      onNavigate?.(`#/editor?id=${encodeURIComponent(bookId)}&tab=ai`);
    });
    root.querySelector('#btnClearMy')?.addEventListener('click', () => {
      const t = root.querySelector('#myTitle');
      const h = root.querySelector('#myHint');
      const p = root.querySelector('#myPrompt');
      if(t) t.value = '';
      if(h) h.value = '';
      if(p) p.value = '';
      onToast?.('已清空');
    });

    // Preview actions
    root.querySelector('#btnCopyPreview')?.addEventListener('click', async () => {
      const ok = await copyText(previewEl()?.value || '');
      onToast?.(ok ? '已複製預覽' : '複製失敗');
    });

    root.querySelector('#btnAppendPreview')?.addEventListener('click', () => {
      const b = store.getBook(bookId);
      const merged = (previewEl()?.value || '').trim();
      if(!merged){ onToast?.('預覽是空的'); return; }
      const next = (b?.aiNotes || '').trim();
      const sep = next ? '\n\n---\n\n' : '';
      store.updateBook(bookId, { aiNotes: `${next}${sep}${merged}` });
      onToast?.('已加入本書指派');
      onNavigate?.(`#/editor?id=${encodeURIComponent(bookId)}&tab=ai`);
    });

    root.querySelector('#btnCopyNotes')?.addEventListener('click', async () => {
      const b = store.getBook(bookId);
      const ok = await copyText(b?.aiNotes || '');
      onToast?.(ok ? '已複製本書指派' : '複製失敗');
    });

    // Import/Export AI library
    const aiFileInput = document.createElement('input');
    aiFileInput.type = 'file';
    aiFileInput.accept = 'application/json';
    aiFileInput.style.display = 'none';
    document.body.appendChild(aiFileInput);

    root.querySelector('#btnExportAi')?.addEventListener('click', () => {
      const obj = store.exportAiLibrary();
      downloadJSON(obj, 'angel-ai-library.json');
      onToast?.('已匯出指令庫');
    });
    root.querySelector('#btnImportAi')?.addEventListener('click', () => {
      aiFileInput.value = '';
      aiFileInput.click();
    });
    aiFileInput.onchange = async () => {
      const f = aiFileInput.files?.[0];
      if(!f) return;
      try{
        const txt = await f.text();
        const obj = JSON.parse(txt);
        const res = store.importAiLibrary(obj);
        if(!res.ok){ onToast?.(res.msg || '匯入失敗'); return; }
        onToast?.('已匯入指令庫');
        onNavigate?.(`#/editor?id=${encodeURIComponent(bookId)}&tab=ai`);
      }catch(e){
        onToast?.('匯入失敗：檔案無法讀取');
      }
    };

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
