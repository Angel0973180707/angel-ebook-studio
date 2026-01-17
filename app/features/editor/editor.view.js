// app/features/editor/editor.view.js
export function editorHTML({ book, tab = 'draft' }) {
  const t = book?.title || '（未命名）';
  const statusTxt = book?.status === 'published' ? '完稿' : '草稿';

  return `
    <section class="edWrap">
      <div class="edTop">
        <button class="btn small ghost" data-action="back">← 回書庫</button>
        <div class="edTopMid">
          <div class="edTitleRow">
            <input class="edTitle" value="${escapeHTML(t)}" placeholder="書名" data-role="title" />
            <span class="pill ${book?.status === 'published' ? 'ok' : ''}">${statusTxt}</span>
          </div>
          <div class="edHint">自動存放｜匯出/匯入 JSON｜一鍵複製段落給 AI</div>
        </div>
        <div class="edTopRight">
          <button class="btn small" data-action="export">匯出</button>
          <button class="btn small ghost" data-action="import">匯入</button>
        </div>
      </div>

      <div class="edTabs">
        ${tabBtn('inspire','靈感素材',tab)}
        ${tabBtn('draft','草稿',tab)}
        ${tabBtn('final','完稿',tab)}
        <div class="edTabsSpacer"></div>
        <button class="btn small ghost" data-action="copyForAI">複製本頁 → AI</button>
      </div>

      <div class="edBody">
        ${tabPanel('inspire', tab, '靈感素材（可貼素材、金句、參考）')}
        ${tabPanel('draft', tab, '草稿（先寫得出來）')}
        ${tabPanel('final', tab, '完稿（整理、定稿、可列印）')}
      </div>

      <div class="edFooter">
        <button class="btn small ghost" data-action="toggleStatus">切換 草稿/完稿</button>
        <div class="edSaved" id="edSaved">已自動存放</div>
      </div>
    </section>
  `;
}

function tabBtn(key, label, active) {
  return `<button class="edTab ${active === key ? 'on' : ''}" data-action="tab" data-tab="${key}">${label}</button>`;
}

function tabPanel(key, active, placeholder) {
  return `
    <div class="edPanel ${active === key ? 'on' : ''}" data-panel="${key}">
      <textarea class="edArea" data-role="${key}" placeholder="${escapeHTML(placeholder)}"></textarea>
    </div>
  `;
}

function escapeHTML(s){
  return String(s ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}