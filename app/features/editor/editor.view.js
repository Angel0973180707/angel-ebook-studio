// app/features/editor/editor.view.js
function esc(s){
  return String(s ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

export function editorHTML({ title, status, tab, data }) {
  const t = tab || 'draft';
  const v = (k) => esc(data?.[k] || '');

  return `
    <section class="panel">
      <div class="panelHead" style="gap:12px; align-items:flex-start;">
        <div style="flex:1; min-width:0;">
          <div class="h2">✍️ 編輯頁</div>
          <div class="sub">靈感／草稿／完稿／協作指令｜自動存放</div>
        </div>

        <div class="panelActions" style="display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end;">
          <button class="btn ghost" data-action="back">← 回書庫</button>
          <button class="btn ghost" data-action="toggleStatus">${status === 'published' ? '設為草稿' : '設為完稿'}</button>
          <button class="btn" data-action="export">一鍵匯出</button>
          <label class="btn ghost" style="cursor:pointer;">
            匯入
            <input type="file" accept="application/json" data-action="import" style="display:none;">
          </label>
        </div>
      </div>

      <div class="card" style="margin-top:12px;">
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; justify-content:space-between;">
          <div style="flex:1; min-width:0;">
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
              <input class="input" data-field="title" placeholder="書名" value="${esc(title || '')}" style="flex:1; min-width:160px;">
              <span class="pill ${status === 'published' ? 'ok' : ''}">${status === 'published' ? '完稿' : '草稿'}</span>
            </div>
          </div>
        </div>

        <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn small ${t==='inspire'?'':'ghost'}" data-tab="inspire">靈感素材</button>
          <button class="btn small ${t==='draft'?'':'ghost'}" data-tab="draft">草稿</button>
          <button class="btn small ${t==='final'?'':'ghost'}" data-tab="final">完稿</button>
          <button class="btn small ${t==='cmd'?'':'ghost'}" data-tab="cmd">協作指令</button>
        </div>

        <div style="margin-top:12px;">
          ${t==='inspire' ? textarea('inspire', '把靈感素材貼在這裡（摘錄／筆記／連結／片段）', v('inspire')) : ''}
          ${t==='draft' ? textarea('draft', '草稿區：先寫出來，再慢慢整理', v('draft')) : ''}
          ${t==='final' ? textarea('final', '完稿區：對外發佈用的版本', v('final')) : ''}
          ${t==='cmd' ? textarea('cmd', '協作指令：你臨時指派給 AI 的工作（可儲存、可複用）', v('cmd')) : ''}
          <div class="sub" style="margin-top:10px; opacity:.8;">✅ 自動存放：每次輸入後會自動保存。</div>
        </div>
      </div>
    </section>
  `;
}

function textarea(key, placeholder, value){
  return `
    <textarea class="textarea" data-field="${key}" placeholder="${esc(placeholder)}"
      style="width:100%; min-height:42vh; resize:vertical; line-height:1.6;">${value}</textarea>
  `;
}