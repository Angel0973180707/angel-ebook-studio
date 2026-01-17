export function aiPanelHTML({ provider }) {
  return `
  <div class="modalBackdrop" data-ai="backdrop" aria-hidden="false">
    <div class="modalSheet" role="dialog" aria-modal="true" aria-label="AI 協作">
      <div class="modalHead">
        <div class="modalTitle">AI 協作</div>
        <button class="btn small ghost" data-ai="close" type="button">關閉</button>
      </div>

      <div class="modalBody">
        <div class="subtle">預設：<b>${provider}</b></div>

        <div class="seg">
          <button class="btn small" data-ai="pick" data-provider="ChatGPT" type="button">ChatGPT（預設）</button>
          <button class="btn small ghost" data-ai="pick" data-provider="Gemini" type="button">Gemini</button>
          <button class="btn small ghost" data-ai="pick" data-provider="Claude" type="button">Claude</button>
        </div>

        <div class="panel mini">
          <div class="h3">你想怎麼協作？</div>
          <textarea id="aiPrompt" class="ta" rows="5" placeholder="例如：幫我把這本書的第一章整理成 3 個段落，語氣溫柔、有畫面感。"></textarea>
          <div class="row">
            <button class="btn" data-ai="openLink" type="button">打開 AI 協作連結</button>
            <button class="btn ghost" data-ai="copyPrompt" type="button">複製提示詞</button>
          </div>
          <div class="hint">提示：我們先做「開連結＋複製提示詞」，先穩再長大。</div>
        </div>
      </div>
    </div>
  </div>
  `;
}