import { escapeHTML } from '../../core/utils.js';

export function editorHTML({ book, content, activeTab='draft' }){
  const title = escapeHTML(book?.title || '未命名');
  const status = book?.status === 'published' ? '完稿' : '草稿';

  return `
    <section class="panel">
      <div class="panelHead">
        <div>
          <div class="h2">✍️ 編輯器</div>
          <div class="sub">${status}｜這本書的靈感/草稿/完稿</div>
        </div>
        <div class="panelActions">
          <button class="btn ghost" data-action="rename">改書名</button>
          <button class="btn ghost" data-action="export">匯出</button>
          <button class="btn ghost" data-action="import">匯入</button>
        </div>
      </div>

      <div class="editorHeader">
        <input class="editorTitle" type="text" value="${title}" data-role="title" spellcheck="false" />
        <div class="tabs" role="tablist">
          <button class="tab ${activeTab==='inspiration'?'active':''}" data-tab="inspiration" type="button">靈感素材</button>
          <button class="tab ${activeTab==='draft'?'active':''}" data-tab="draft" type="button">草稿</button>
          <button class="tab ${activeTab==='final'?'active':''}" data-tab="final" type="button">完稿</button>
          <button class="tab ${activeTab==='ai'?'active':''}" data-tab="ai" type="button">AI 指派</button>
        </div>
      </div>

      <div class="editorBody">
        <div class="tabPanel ${activeTab==='inspiration'?'show':''}" data-panel="inspiration">
          <textarea class="editorArea" data-field="inspiration" placeholder="放靈感、素材、段落、摘錄…">${escapeHTML(content.inspiration||'')}</textarea>
        </div>
        <div class="tabPanel ${activeTab==='draft'?'show':''}" data-panel="draft">
          <textarea class="editorArea" data-field="draft" placeholder="先讓內容落地，順著寫就好…">${escapeHTML(content.draft||'')}</textarea>
        </div>
        <div class="tabPanel ${activeTab==='final'?'show':''}" data-panel="final">
          <textarea class="editorArea" data-field="final" placeholder="把草稿慢慢整理成書稿…">${escapeHTML(content.final||'')}</textarea>
        </div>
        <div class="tabPanel ${activeTab==='ai'?'show':''}" data-panel="ai">
          <div class="aiNote">
            <div class="aiNoteTitle">本書 AI 臨時指派</div>
            <div class="aiNoteSub">這裡存放你臨時指定的協作指令、整理要求、待辦。可匯出/匯入。</div>
            <textarea class="editorArea" data-field="ai_temp" placeholder="例：把第3章改成書稿結構；加入練習；去 AI 感…"></textarea>
            <div class="row" style="margin-top:10px;">
              <button class="btn" data-action="ai_open" type="button">開 AI 協作抽屜</button>
              <button class="btn ghost" data-action="ai_save" type="button">存到臨時指派</button>
            </div>
          </div>
        </div>
      </div>

      <input type="file" id="fileImport" accept="application/json" style="display:none" />
    </section>
  `;
}
