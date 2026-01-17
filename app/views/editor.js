// app/views/editor.js
export function mountEditor(root, { store, bookId, toast }) {
  const book = store.getBook(bookId);
  if (!book) {
    root.innerHTML = `
      <section class="card editor">
        <div class="panelHead"><div>找不到這本書</div></div>
        <div class="panelBody">
          <button class="btn" onclick="location.hash=''">回到書庫</button>
        </div>
      </section>`;
    return;
  }

  root.innerHTML = `
    <section class="card editor" data-book="${book.id}">
      <div class="panelHead">
        <input class="titleInput" value="${escapeHTML(book.title)}" placeholder="書名（點此編輯）" />
        <div class="right">
          <span class="pill ${book.status === 'published' ? 'ok' : ''}">
            ${book.status === 'published' ? '完稿' : '草稿'}
          </span>
        </div>
      </div>

      <div class="panelBody">
        <div class="tabs" role="tablist">
          <button class="tab" role="tab" data-tab="idea" aria-selected="true">靈感</button>
          <button class="tab" role="tab" data-tab="draft">草稿</button>
          <button class="tab" role="tab" data-tab="final">完稿</button>
          <button class="tab" role="tab" data-tab="ai">AI 協作</button>
        </div>

        <div class="tabBody" data-tab="idea">
          ${area('idea', book.pages?.idea || '', '把任何靈感放在這裡，它們不用立刻有秩序。')}
        </div>

        <div class="tabBody" data-tab="draft" hidden>
          ${area('draft', book.pages?.draft || '', '慢慢寫，不用一次想清楚。')}
        </div>

        <div class="tabBody" data-tab="final" hidden>
          ${area('final', book.pages?.final || '', '這裡的文字，未來會進 EPUB / PDF。')}
        </div>

        <div class="tabBody" data-tab="ai" hidden>
          ${aiPanel()}
        </div>
      </div>
    </section>
  `;

  // title autosave
  const titleInput = root.querySelector('.titleInput');
  titleInput.addEventListener('input', (e) => {
    store.updateBook(book.id, { title: e.target.value });
  });

  // tab switch
  root.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  function switchTab(tab) {
    root.querySelectorAll('.tab').forEach((b) =>
      b.setAttribute('aria-selected', String(b.dataset.tab === tab))
    );
    root.querySelectorAll('.tabBody').forEach((b) => {
      b.hidden = b.dataset.tab !== tab;
    });
  }

  // textarea autosave
  root.querySelectorAll('textarea[data-key]').forEach((el) => {
    el.addEventListener('input', () => {
      const key = el.dataset.key;
      const cur = store.getBook(book.id);
      const pages = { ...(cur.pages || {}), [key]: el.value };
      store.updateBook(book.id, { pages });
    });
  });

  // AI quick copy buttons
  root.querySelectorAll('[data-cmd]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const cmd = btn.dataset.cmd;
      let clip = '';
      if (cmd === 'copy-chapter') clip = templates.chapter();
      if (cmd === 'copy-deai') clip = templates.deai();
      if (cmd === 'copy-exercise') clip = templates.exercise();

      if (!clip) return;

      try {
        await navigator.clipboard.writeText(clip);
        toast?.('已複製到剪貼簿，可貼到 ChatGPT');
      } catch (e) {
        // fallback: prompt copy
        window.prompt('複製下面文字：', clip);
      }
    });
  });
}

function area(key, value, hint) {
  return `
    <textarea class="textarea" data-key="${key}" placeholder="${escapeHTML(hint)}">${escapeHTML(
    value || ''
  )}</textarea>
    <div class="hint">自動存放中</div>
  `;
}

function aiPanel() {
  return `
    <div class="aiPanel">
      <div class="aiCard">
        <div class="title">快速指令</div>
        <div class="desc">點一下複製，貼到 ChatGPT（已去AI感、混合語氣）。</div>
        <div class="row">
          <button class="btn" data-cmd="copy-chapter">口說稿 → 書稿（章節版）</button>
          <button class="btn" data-cmd="copy-deai">去 AI 感潤稿</button>
          <button class="btn" data-cmd="copy-exercise">章節小練功（混合配速）</button>
        </div>
      </div>
      <div class="aiCard">
        <div class="title">小練功 · 混合配速</div>
        <div class="desc">30–60秒的即刻安住 × 1–3分鐘的穩定儀式。</div>
        <div class="hint">產出後請貼回「完稿」。</div>
      </div>
    </div>
  `;
}

const templates = {
  chapter() {
    return `你是一位溫柔而篤定的編輯者，熟悉親子教養、心理與腦科學，也懂得以哲思提問。請把以下口說稿/逐字稿改寫為電子書章節，遵守：1) 章標題(10–18字)；2) 開場畫面段(80–120字)；3) 核心概念(自我穩定/自在感/我能感)；4) 微科學角度(生活例子、不堆術語)；5) 教養/關係角度(給一句可說出口的話)；6) 哲思留白(用提問)；7) 小練功(依章節自動給30–60s或1–3min，必要時兩者)；8) 章末小結(很短)。禁用首先/其次/總結；少條列；自然停頓。輸入內容如下：`;
  },
  deai() {
    return `請將以下文字去除AI句型與說教感：減少條列、避免總結式轉折；加入生活畫面與自然停頓；保留溫柔但不煽情。篇幅不拉長。輸入如下：`;
  },
  exercise() {
    return `針對下文章節內容，產出小練功：① 即刻可做30–60s（一句引導語＋一個身體動作）；② 視章節重量加上1–3min穩定儀式（呼吸/書寫/一句可說出口的話）。語氣混合，結尾依章節自動切。內容如下：`;
  }
};

function escapeHTML(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}