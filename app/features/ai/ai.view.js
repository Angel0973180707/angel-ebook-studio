import { AI_DEFAULTS, AI_STATES, AI_LENSES } from '../../core/constants.js';

export function aiDrawerHTML({ provider, stateKey, lensKey, hasContext }){
  const providerRadios = AI_DEFAULTS.providers.map(p=>`
    <label class="pillRadio">
      <input type="radio" name="ai_provider" value="${p.key}" ${p.key===provider?'checked':''} />
      <span>${p.name}</span>
    </label>
  `).join('');

  const stateRadios = AI_STATES.map(s=>`
    <label class="pillRadio">
      <input type="radio" name="ai_state" value="${s.key}" ${s.key===stateKey?'checked':''} />
      <span>${s.label}</span>
    </label>
  `).join('');

  const lensRadios = AI_LENSES.map(l=>`
    <label class="pillRadio">
      <input type="radio" name="ai_lens" value="${l.key}" ${l.key===lensKey?'checked':''} />
      <span>${l.label}</span>
    </label>
  `).join('');

  return `
  <div class="drawer" id="aiDrawer" aria-hidden="true">
    <div class="drawerOverlay" data-action="close"></div>
    <div class="drawerInner" role="dialog" aria-modal="true">
      <div class="drawerHead">
        <div>
          <div class="drawerTitle">AI 協作</div>
          <div class="drawerSub">狀態 × 角度｜AI 在旁，人是主體</div>
        </div>
        <button class="btn ghost" data-action="close" type="button">關閉</button>
      </div>

      <div class="drawerSection">
        <div class="k">預設 AI</div>
        <div class="pillGroup" data-role="provider">${providerRadios}</div>
        <div class="hint">預設使用 ChatGPT；Gemini / Claude 為備選。</div>
      </div>

      <div class="drawerSection">
        <div class="k">狀態（必選 1）</div>
        <div class="pillGroup" data-role="state">${stateRadios}</div>
        <div class="hint">先站穩，再出發。</div>
      </div>

      <div class="drawerSection">
        <div class="k">角度（必選 1）</div>
        <div class="pillGroup" data-role="lens">${lensRadios}</div>
        <div class="hint">從一個角度看就好，文字會更乾淨。</div>
      </div>

      <div class="drawerSection">
        <div class="k">任務（可空白）</div>
        <textarea class="promptBox" id="aiTask" placeholder="例：口說稿→書稿、加入練習與工具、去 AI 感…"></textarea>
        <div class="row" style="margin-top:10px;">
          <button class="btn" data-action="compose" type="button">產生協作指令</button>
          <button class="btn ghost" data-action="copy" type="button">複製指令</button>
          <button class="btn ghost" data-action="open_provider" type="button">開啟 AI 網站</button>
        </div>
        <div class="hint">${hasContext ? '會自動帶入目前分頁內容（靈感/草稿/完稿）。' : '回到某一本書的編輯頁，才能自動帶入內容。'}</div>
      </div>

      <div class="drawerSection">
        <div class="k">生成結果</div>
        <textarea class="resultBox" id="aiResult" placeholder="這裡會出現可直接貼給 AI 的完整指令…" readonly></textarea>
        <div class="row" style="margin-top:10px;">
          <button class="btn" data-action="save_to_temp" type="button">存到本書 AI 指派</button>
          <button class="btn ghost" data-action="save_to_library" type="button">存到指令庫</button>
        </div>
        <div class="hint">「本書 AI 指派」會跟著這本書走；「指令庫」是全域可重複用。</div>
      </div>

      <div class="drawerSection">
        <div class="k">指令庫（快速插入）</div>
        <div id="aiLibrary"></div>
      </div>
    </div>
  </div>`;
}
