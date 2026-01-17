// app/features/editor/editor.view.js
export function editorHTML({ book, tab, provider }) {
  const title = book?.title || '（未命名）';

  return `
  <section class="ed">
    <header class="edTop">
      <button class="btn ghost small" data-ed="back" type="button">← 書庫</button>

      <div class="edTitleWrap">
        <input class="edTitle" data-ed="title" value="${esc(title)}" placeholder="書名（可改）" />
        <div class="edMeta">
          <span class="pill ${book.status === 'published' ? 'ok' : ''}">
            ${book.status === 'published' ? '完稿' : '草稿'}
          </span>
          <span class="metaTxt">更新：${fmt(book.updatedAt)}</span>
        </div>
      </div>

      <div class="edTopBtns">
        <button class="btn small" data-ed="ai" type="button">AI協作</button>
        <button class="btn small ghost" data-ed="more" type="button">更多</button>
      </div>
    </header>

    <nav class="edTabs" role="tablist">
      <button class="tab ${tab==='inspiration'?'on':''}" data-ed="tab" data-tab="inspiration" type="button">靈感</button>
      <button class="tab ${tab==='draft'?'on':''}" data-ed="tab" data-tab="draft" type="button">草稿</button>
      <button class="tab ${tab==='content'?'on':''}" data-ed="tab" data-tab="content" type="button">完稿</button>
    </nav>

    <main class="edBody">
      <textarea class="edTA" data-ed="ta" spellcheck="false"
        placeholder="${tab==='inspiration' ? '靈感先丟進來，不用整理。' : tab==='draft' ? '先寫草稿，讓它慢慢長大。' : '把它寫到你願意定下來。'}"
      >${esc(getTabText(book, tab))}</textarea>

      <div class="edFooter">
        <button class="btn ghost" data-ed="toggleStatus" type="button">切換 草稿/完稿</button>
        <div class="hint">自動保存：停筆約 0.35 秒會保存。</div>
      </div>
    </main>
  </section>

  ${moreSheetHTML()}
  ${aiSheetHTML({ provider })}
  `;
}

export function moreSheetHTML() {
  return `
  <div class="sheetBackdrop" data-sheet="backdrop" hidden>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="更多">
      <div class="sheetHead">
        <div class="sheetTitle">更多</div>
        <button class="btn small ghost" data-sheet="close" type="button">關閉</button>
      </div>

      <div class="sheetBody">
        <div class="sheetGrid">
          <button class="btn" data-sheet="export" type="button">一鍵匯出</button>
          <button class="btn ghost" data-sheet="import" type="button">一鍵匯入</button>
          <button class="btn ghost" data-sheet="cloudSave" type="button">存雲端（v2）</button>
          <button class="btn ghost" data-sheet="cloudLoad" type="button">雲端取回（v2）</button>
        </div>

        <input id="importFile" type="file" accept="application/json" hidden />

        <div class="note">
          <div class="noteTitle">說明</div>
          <div class="noteTxt">
            匯出/匯入採用 JSON（整本書完整資料），方便備份、換裝置、未來雲端同步。<br/>
            雲端功能 v1 先留接口，v2 再接你要的雲端（Google Drive / Dropbox / 自建 / Firebase）。
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
}

export function aiSheetHTML({ provider }) {
  return `
  <div class="aiBackdrop" data-ai="backdrop" hidden>
    <div class="aiSheet" role="dialog" aria-modal="true" aria-label="AI 協作">
      <div class="aiHead">
        <div class="aiTitle">AI 協作</div>
        <button class="btn small ghost" data-ai="close" type="button">關閉</button>
      </div>

      <div class="aiBody">
        <div class="aiRow">
          <div class="aiLabel">使用</div>
          <div class="aiPills">
            <button class="btn small ${provider==='ChatGPT'?'':'ghost'}" data-ai="provider" data-provider="ChatGPT" type="button">ChatGPT（預設）</button>
            <button class="btn small ${provider==='Gemini'?'':'ghost'}" data-ai="provider" data-provider="Gemini" type="button">Gemini</button>
            <button class="btn small ${provider==='Claude'?'':'ghost'}" data-ai="provider" data-provider="Claude" type="button">Claude</button>
          </div>
        </div>

        <div class="aiBlock">
          <div class="aiSub">臨時指派（可儲存）</div>
          <textarea class="aiTA" data-ai="prompt" rows="4"
            placeholder="例如：把這段整理成『場景/感受/洞見』，語氣溫柔、有畫面感。"></textarea>
          <div class="aiBtns">
            <button class="btn" data-ai="copy" type="button">複製提示詞</button>
            <button class="btn ghost" data-ai="open" type="button">打開 AI</button>
            <button class="btn ghost" data-ai="saveCmd" type="button">儲存到指令庫</button>
          </div>
          <div class="aiHint">v1 先用「複製 → 貼到 AI 視窗」最穩，不需要 API 金鑰。</div>
        </div>

        <div class="aiBlock">
          <div class="aiSub">我的指令庫</div>
          <div class="aiCmdRow">
            <input class="aiInput" data-ai="cmdTitle" placeholder="指令名稱（可留空）" />
            <button class="btn small" data-ai="addCmd" type="button">＋新增</button>
          </div>
          <div class="aiCmdList" data-ai="cmdList"></div>
        </div>
      </div>
    </div>
  </div>
  `;
}

export function cmdItemHTML(cmd) {
  return `
  <div class="aiCmdItem" data-cmd-id="${esc(cmd.id)}">
    <div class="aiCmdMain">
      <div class="aiCmdTitle">${esc(cmd.title || '（未命名指令）')}</div>
      <div class="aiCmdPrompt">${esc(cmd.prompt || '')}</div>
    </div>
    <div class="aiCmdBtns">
      <button class="btn small ghost" data-ai="useCmd" type="button">套用</button>
      <button class="btn small danger" data-ai="delCmd" type="button">刪除</button>
    </div>
  </div>
  `;
}

function getTabText(book, tab) {
  if (!book) return '';
  if (tab === 'inspiration') return book.inspiration || '';
  if (tab === 'draft') return book.draft || '';
  return book.content || '';
}

function fmt(ts) {
  const d = new Date(ts || Date.now());
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${dd} ${hh}:${mm}`;
}

function esc(s) {
  return String(s ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}
