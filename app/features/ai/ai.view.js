// app/features/ai/ai.view.js
export function aiDrawerHTML({ title = 'AI 協作', prompts = [] } = {}) {
  const items = prompts.length
    ? prompts.map((p, idx) => `
      <article class="aiCard" data-idx="${idx}">
        <div class="aiCardTxt">
          <div class="aiCardTitle">${escapeHTML(p.title || '未命名指令')}</div>
          <div class="aiCardDesc">${escapeHTML(p.desc || '')}</div>
        </div>
        <div class="aiCardActions">
          <button class="btn small" data-action="apply" data-idx="${idx}">套用</button>
          <button class="btn small danger" data-action="remove" data-idx="${idx}">刪除</button>
        </div>
      </article>
    `).join('')
    : `<div class="aiEmpty">
         <div class="aiEmptyTitle">還沒有指令</div>
         <div class="aiEmptySub">你可以先新增一條「臨時指派」，之後再存成指令庫。</div>
       </div>`;

  return `
    <div class="aiBackdrop" data-action="close"></div>
    <section class="aiDrawer" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}">
      <div class="aiHead">
        <div class="aiHeadLeft">
          <div class="aiHeadTitle">${escapeHTML(title)}</div>
          <div class="aiHeadSub">可儲存臨時指派｜可建立指令庫</div>
        </div>
        <button class="btn small ghost" data-action="close">關閉</button>
      </div>

      <div class="aiToolbar">
        <button class="btn small" data-action="new">＋ 臨時指派</button>
        <button class="btn small ghost" data-action="library">指令庫</button>
      </div>

      <!-- ✅ 這個 aiBody 一定要能滾動 -->
      <div class="aiBody" id="aiBody">
        ${items}
      </div>
    </section>
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