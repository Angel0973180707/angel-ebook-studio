// app/features/editor/editor.logic.js
import { editorHTML, cmdItemHTML } from './editor.view.js';

const BOOKS_KEY = 'angel_ebook_books_v1';

const AI_PROVIDER_KEY = 'angel_ebook_ai_provider_v1';
const AI_CMDS_KEY = 'angel_ebook_ai_cmds_v1';

const DEFAULT_CMDS = [
  { title:'靈感整理成三類', prompt:'把我貼的素材整理成「場景 / 感受 / 洞見」三類，每類給 3–5 點，保留原味。' },
  { title:'從素材長出段落', prompt:'從這些素材挑 3 個最有力的點，各寫成 1 段 80–120 字短段落，語氣溫柔但有力量。' },
  { title:'抓出一句核心金句', prompt:'用一句話抓出這段的核心（像定錨），不要說教，要有畫面感。' },
  { title:'幫我排結構（起承轉合）', prompt:'把這篇草稿整理成「開場/轉折/落地/收束」四段結構，每段一句重點。' },
  { title:'口說長片稿', prompt:'把這段改成我可以直接對鏡頭講的口說稿：句子短、語速慢、留白感。' },
  { title:'Angel 風格定稿', prompt:'幫我潤稿成「不說教、溫柔但篤定」的文字，語句順、有畫面感，不浮誇。' }
];

function loadBooks() {
  try { return JSON.parse(localStorage.getItem(BOOKS_KEY)) || []; }
  catch { return []; }
}
function saveBooks(books) {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}
function newId() {
  try { return crypto.randomUUID(); }
  catch { return 'id_' + Date.now() + '_' + Math.random().toString(16).slice(2); }
}

function getProvider() {
  return localStorage.getItem(AI_PROVIDER_KEY) || 'ChatGPT';
}
function setProvider(p) {
  localStorage.setItem(AI_PROVIDER_KEY, p);
}
function aiUrl(provider) {
  if (provider === 'Gemini') return 'https://gemini.google.com/';
  if (provider === 'Claude') return 'https://claude.ai/';
  return 'https://chat.openai.com/';
}

function seedCmdsIfNeeded() {
  try {
    const raw = localStorage.getItem(AI_CMDS_KEY);
    if (raw) return;
  } catch {}

  const seeded = DEFAULT_CMDS.map(x => ({
    id: newId(),
    title: x.title,
    prompt: x.prompt,
    createdAt: Date.now(),
    lastUsedAt: 0
  }));
  localStorage.setItem(AI_CMDS_KEY, JSON.stringify(seeded));
}
function loadCmds() {
  seedCmdsIfNeeded();
  try { return JSON.parse(localStorage.getItem(AI_CMDS_KEY)) || []; }
  catch { return []; }
}
function saveCmds(cmds) {
  localStorage.setItem(AI_CMDS_KEY, JSON.stringify(cmds));
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function copyToClipboard(text) {
  if (!text) return false;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text);
    return true;
  }
  const t = document.createElement('textarea');
  t.value = text;
  document.body.appendChild(t);
  t.select();
  document.execCommand('copy');
  t.remove();
  return true;
}

export function mountEditor(root, { bookId }) {
  if (!root) return;

  let tab = 'inspiration';
  let books = loadBooks();
  let book = books.find(b => b.id === bookId);

  if (!book) {
    location.hash = '#/bookshelf';
    return;
  }

  let cmds = loadCmds();

  function updateBook(patch) {
    books = books.map(b => {
      if (b.id !== bookId) return b;
      return { ...b, ...patch, updatedAt: new Date().toISOString() };
    });
    saveBooks(books);
    book = books.find(b => b.id === bookId);
  }

  function currentText() {
    if (tab === 'inspiration') return book.inspiration || '';
    if (tab === 'draft') return book.draft || '';
    return book.content || '';
  }

  function setTabText(text) {
    if (tab === 'inspiration') updateBook({ inspiration: text });
    else if (tab === 'draft') updateBook({ draft: text });
    else updateBook({ content: text });
  }

  function openSheet(kind) {
    if (kind === 'more') {
      const el = document.querySelector('[data-sheet="backdrop"]');
      if (el) el.hidden = false;
    }
    if (kind === 'ai') {
      const el = document.querySelector('[data-ai="backdrop"]');
      if (el) el.hidden = false;
    }
  }
  function closeSheet(kind) {
    if (kind === 'more') {
      const el = document.querySelector('[data-sheet="backdrop"]');
      if (el) el.hidden = true;
    }
    if (kind === 'ai') {
      const el = document.querySelector('[data-ai="backdrop"]');
      if (el) el.hidden = true;
    }
  }

  function renderCmdList() {
    const list = document.querySelector('[data-ai="cmdList"]');
    if (!list) return;

    const sorted = [...cmds].sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0));
    list.innerHTML = sorted.length
      ? sorted.map(cmdItemHTML).join('')
      : `<div class="empty"><div class="emptyTitle">還沒有指令</div><div class="emptySub">先新增一條你常用的協作指派。</div></div>`;
  }

  let autosaveTimer = null;
  function bindAutosave() {
    const ta = root.querySelector('[data-ed="ta"]');
    if (!ta) return;

    ta.addEventListener('input', () => {
      clearTimeout(autosaveTimer);
      autosaveTimer = setTimeout(() => {
        setTabText(ta.value || '');
      }, 350);
    });
  }

  function render() {
    root.innerHTML = editorHTML({
      book,
      tab,
      provider: getProvider()
    });

    renderCmdList();
    bindAutosave();
  }

  function openAIWithPreset() {
    // 先把目前分頁內容帶進臨時指派（你可自行刪改）
    const preset =
`請以「不說教、溫柔但篤定、有畫面感、可落地」的語氣協作。

【目前分頁】${tab}
【內容】
${currentText()}

【指派】`;
    const p = document.querySelector('[data-ai="prompt"]');
    if (p) p.value = preset;
    openSheet('ai');
  }

  // Event delegation
  root.addEventListener('click', (e) => {
    const t = e.target;

    // back
    if (t.closest('[data-ed="back"]')) {
      location.hash = '#/bookshelf';
      return;
    }

    // tab switch
    const tabBtn = t.closest('[data-ed="tab"]');
    if (tabBtn) {
      tab = tabBtn.dataset.tab || 'inspiration';
      render();
      return;
    }

    // toggle draft/published
    if (t.closest('[data-ed="toggleStatus"]')) {
      const next = (book.status === 'published') ? 'draft' : 'published';
      updateBook({ status: next });
      render();
      return;
    }

    // open AI
    if (t.closest('[data-ed="ai"]')) {
      openAIWithPreset();
      return;
    }

    // open more
    if (t.closest('[data-ed="more"]')) {
      openSheet('more');
      return;
    }

    // ===== MORE sheet handlers =====
    if (t.dataset?.sheet === 'backdrop') { closeSheet('more'); return; }
    if (t.closest('[data-sheet="close"]')) { closeSheet('more'); return; }

    if (t.closest('[data-sheet="export"]')) {
      const payload = {
        schema: 'angel-ebook-studio/book/v1',
        exportedAt: new Date().toISOString(),
        book: { ...book }
      };
      const safeTitle = (book.title || 'ebook').replace(/[\\/:*?"<>|]/g, '').slice(0, 40) || 'ebook';
      downloadText(`${safeTitle}-${book.id}.json`, JSON.stringify(payload, null, 2));
      return;
    }

    if (t.closest('[data-sheet="import"]')) {
      const input = document.getElementById('importFile');
      if (!input) return;
      input.value = '';
      input.click();
      return;
    }

    if (t.closest('[data-sheet="cloudSave"]')) {
      alert('雲端存放 v2 才會接（已保留接口）。你想接 Google Drive / Dropbox / Firebase / 自建？到時我直接幫你接上。');
      return;
    }
    if (t.closest('[data-sheet="cloudLoad"]')) {
      alert('雲端取回 v2 才會接（已保留接口）。');
      return;
    }

    // ===== AI sheet handlers =====
    if (t.dataset?.ai === 'backdrop') { closeSheet('ai'); return; }
    if (t.closest('[data-ai="close"]')) { closeSheet('ai'); return; }

    const pBtn = t.closest('[data-ai="provider"]');
    if (pBtn) {
      setProvider(pBtn.dataset.provider || 'ChatGPT');
      render();
      openSheet('ai');
      return;
    }

    if (t.closest('[data-ai="copy"]')) {
      const prompt = document.querySelector('[data-ai="prompt"]')?.value?.trim() || '';
      if (!prompt) return alert('先寫一句你要 AI 幫你的事～');
      copyToClipboard(prompt);
      alert('已複製 ✅');
      return;
    }

    if (t.closest('[data-ai="open"]')) {
      window.open(aiUrl(getProvider()), '_blank');
      return;
    }

    if (t.closest('[data-ai="saveCmd"]')) {
      const prompt = document.querySelector('[data-ai="prompt"]')?.value?.trim() || '';
      if (!prompt) return alert('提示詞是空的，先寫一句再存～');

      const title = (document.querySelector('[data-ai="cmdTitle"]')?.value || '').trim()
        || prompt.split('\n').find(Boolean)?.slice(0, 18)
        || '我的協作指令';

      cmds.unshift({
        id: newId(),
        title,
        prompt,
        createdAt: Date.now(),
        lastUsedAt: Date.now()
      });
      saveCmds(cmds);

      const titleInput = document.querySelector('[data-ai="cmdTitle"]');
      if (titleInput) titleInput.value = '';

      render();
      openSheet('ai');
      alert('已存到指令庫 ✅');
      return;
    }

    if (t.closest('[data-ai="addCmd"]')) {
      const title = (document.querySelector('[data-ai="cmdTitle"]')?.value || '').trim();
      const prompt = (document.querySelector('[data-ai="prompt"]')?.value || '').trim();
      if (!prompt) return alert('先在「臨時指派」寫好提示詞，再按新增。');

      cmds.unshift({
        id: newId(),
        title: title || '（未命名指令）',
        prompt,
        createdAt: Date.now(),
        lastUsedAt: Date.now()
      });
      saveCmds(cmds);

      const titleInput = document.querySelector('[data-ai="cmdTitle"]');
      if (titleInput) titleInput.value = '';

      render();
      openSheet('ai');
      alert('已新增到指令庫 ✅');
      return;
    }

    const cmdItem = t.closest('.aiCmdItem');
    if (cmdItem) {
      const cmdId = cmdItem.dataset.cmdId;

      if (t.closest('[data-ai="delCmd"]')) {
        const ok = confirm('刪除這條指令？');
        if (!ok) return;
        cmds = cmds.filter(c => c.id !== cmdId);
        saveCmds(cmds);
        render();
        openSheet('ai');
        return;
      }

      if (t.closest('[data-ai="useCmd"]')) {
        const cmd = cmds.find(c => c.id === cmdId);
        if (!cmd) return;

        const merged =
`${cmd.prompt}

【目前分頁】${tab}
【內容】
${currentText()}`;

        const p = document.querySelector('[data-ai="prompt"]');
        if (p) p.value = merged;

        copyToClipboard(merged);

        cmds = cmds.map(c => c.id === cmdId ? { ...c, lastUsedAt: Date.now() } : c);
        saveCmds(cmds);

        render();
        openSheet('ai');
        alert('已套用並複製 ✅');
        return;
      }
    }
  });

  // file import handler (needs to be bound once after render)
  root.addEventListener('change', (e) => {
    const input = e.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (input.id !== 'importFile') return;

    const f = input.files?.[0];
    if (!f) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || ''));
        if (data?.schema !== 'angel-ebook-studio/book/v1' || !data?.book?.id) {
          alert('這個檔案不是 Angel Ebook Studio 的匯出格式。');
          return;
        }

        const imported = data.book;

        const mode = confirm('匯入方式：\n【確定】覆蓋目前這本書\n【取消】新增為另一本書');
        if (mode) {
          // overwrite current book (keep same id)
          const patch = {
            title: imported.title ?? book.title,
            status: imported.status ?? book.status,
            inspiration: imported.inspiration ?? '',
            draft: imported.draft ?? '',
            content: imported.content ?? '',
            updatedAt: new Date().toISOString()
          };
          updateBook(patch);
          render();
          alert('已覆蓋匯入 ✅');
          return;
        }

        // add as new book
        const newBook = {
          id: newId(),
          title: imported.title || '匯入的書',
          status: imported.status || 'draft',
          inspiration: imported.inspiration || '',
          draft: imported.draft || '',
          content: imported.content || '',
          updatedAt: new Date().toISOString()
        };

        const all = loadBooks();
        saveBooks([newBook, ...all]);
        alert('已新增匯入為新書 ✅');
        location.hash = `#/book/${encodeURIComponent(newBook.id)}`;
      } catch (err) {
        alert('匯入失敗：JSON 解析錯誤。');
      }
    };
    reader.readAsText(f, 'utf-8');
  });

  // title autosave + immediate update
  root.addEventListener('input', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement)) return;
    if (el.dataset?.ed !== 'title') return;

    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      updateBook({ title: el.value || '（未命名）' });
      // 不重 render，避免輸入時跳動；只更新儲存即可
    }, 350);
  });

  render();
        }
