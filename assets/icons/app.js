'use strict';

const VERSION = 'v0.1-pack';
const LS_AI_PROVIDER = 'angel_ebook_ai_provider_v1';
const LS_AI_CUSTOM = 'angel_ebook_ai_custom_url_v1';

const AI_URLS = {
  chatgpt: 'https://chatgpt.com/',
  gemini: 'https://gemini.google.com/',
  claude: 'https://claude.ai/'
};

const SOUND_FILES = {
  night: 'assets/audio/night.mp3',
  ocean: 'assets/audio/ocean.mp3'
};

const $ = (sel, root=document) => root.querySelector(sel);

function toast(msg){
  const el = $('#toast');
  if(!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> el.classList.remove('show'), 1600);
}

function safeUrl(str){
  const s = (str || '').trim();
  if(!s) return '';
  try{ return new URL(s).toString(); }catch(e){ return ''; }
}

function getAiProvider(){
  const p = (localStorage.getItem(LS_AI_PROVIDER) || 'chatgpt').trim();
  if(p === 'custom') return 'custom';
  return AI_URLS[p] ? p : 'chatgpt';
}

function getAiUrl(provider){
  if(provider === 'custom'){
    const cu = safeUrl(localStorage.getItem(LS_AI_CUSTOM) || '');
    return cu || AI_URLS.chatgpt;
  }
  return AI_URLS[provider] || AI_URLS.chatgpt;
}

function setAiProvider(provider, customUrl){
  if(provider === 'custom'){
    const ok = safeUrl(customUrl);
    if(!ok) return { ok:false, msg:'自訂連結格式不正確（要含 https:// ）' };
    localStorage.setItem(LS_AI_PROVIDER, 'custom');
    localStorage.setItem(LS_AI_CUSTOM, ok);
    return { ok:true, msg:'已儲存：自訂 AI 連結' };
  }
  if(!AI_URLS[provider]) provider = 'chatgpt';
  localStorage.setItem(LS_AI_PROVIDER, provider);
  return { ok:true, msg:`已儲存：${provider.toUpperCase()} 入口` };
}

/** AI 提示詞模板 */
const PROMPTS = [
  {
    id: 'smooth',
    label: '段落磨順（口說化）',
    build: (text) => `你是我的溫柔協作夥伴。請把下面文字改成「口說更順、溫柔而篤定、不說教、但更有畫面感」的版本。\n保留原意，不灌水，不賣弄術語。\n最後再給我 1 句「可直接說出口」的收尾句。\n\n【原文】\n${text || '（請貼上原文）'}`
  },
  {
    id: 'shorten',
    label: '精簡成重點',
    build: (text) => `請把下面文字精簡成「讀者一看就懂」的版本：\n- 字數縮到 60% 左右\n- 保留關鍵訊息與情緒\n- 結尾給我 3 個小標題選項（10 字內）\n\n【原文】\n${text || '（請貼上原文）'}`
  },
  {
    id: 'expand',
    label: '擴寫更有層次',
    build: (text) => `請把下面文字擴寫成更完整的段落（加深層次、但不離題）：\n- 增加一個生活場景例子\n- 增加一段轉折（看見 → 轉念 → 可行動）\n- 保持溫柔、非說教\n最後給我 2 句「讀者可以立刻做的微行動」。\n\n【原文】\n${text || '（請貼上原文）'}`
  },
  {
    id: 'outline',
    label: '章節大綱整理',
    build: (text) => `請把下面內容整理成「電子書章節大綱」：\n1) 章節標題（10-16 字）\n2) 3-5 個段落小標\n3) 每段一句摘要（30 字內）\n4) 最後加一段「讀者收穫」（50-80字）\n\n【素材】\n${text || '（請貼上素材/筆記）'}`
  },
  {
    id: 'titles',
    label: '金句＋小標生成',
    build: (text) => `請根據下面文字，生成：\n- 8 個小標題（12 字內，溫柔有力量）\n- 6 句金句（適合放在書中當段落引言）\n- 3 句「可直接說出口」的溝通句（更生活化）\n\n【原文】\n${text || '（請貼上原文）'}`
  }
];

function renderChips(){
  const box = $('#promptChips');
  box.innerHTML = '';
  for(const p of PROMPTS){
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.dataset.id = p.id;
    btn.textContent = p.label;
    box.appendChild(btn);
  }
}

function setActiveChip(id){
  $('#promptChips').querySelectorAll('.chip').forEach(ch => {
    ch.classList.toggle('active', ch.dataset.id === id);
  });
}

function buildPrompt(activeId, sourceText){
  const p = PROMPTS.find(x => x.id === activeId) || PROMPTS[0];
  return p.build((sourceText || '').trim());
}

async function copyToClipboard(text){
  if(!text) return false;
  try{
    await navigator.clipboard.writeText(text);
    return true;
  }catch(e){
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try{ ok = document.execCommand('copy'); }catch(_){ ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
}

// ===== Sound Dock (night / ocean) =====
let currentKey = null;
let audio = null;

function ensureAudio(key){
  if(!audio){
    audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.55;
  }
  audio.src = SOUND_FILES[key];
  return audio;
}

function stopSound(){
  if(audio){
    audio.pause();
    audio.currentTime = 0;
  }
  currentKey = null;
  document.querySelectorAll('[data-sound]').forEach(b=>b.setAttribute('aria-pressed','false'));
}

async function playSound(key){
  if(currentKey === key){
    stopSound();
    return;
  }
  stopSound();
  currentKey = key;
  const a = ensureAudio(key);
  try{
    await a.play();
    document.querySelectorAll('[data-sound]').forEach(b=>{
      b.setAttribute('aria-pressed', b.dataset.sound === key ? 'true' : 'false');
    });
  }catch(e){
    alert('請再點一次按鈕開始播放（瀏覽器限制）。\n若仍無聲，請確認 assets/audio/ 裡真的有 night.mp3 / ocean.mp3');
  }
}

function initAiDialog(){
  const dlg = $('#aiDialog');
  const btnAi = $('#btnAi');
  const btnClose = $('#btnCloseAi');
  const providerSel = $('#aiProvider');
  const customBox = $('#customLinkBox');
  const aiLinkInput = $('#aiLink');
  const btnSave = $('#btnSaveAi');

  const sourceText = $('#sourceText');
  const promptBox = $('#promptBox');
  const btnCopy = $('#btnCopyPrompt');
  const btnOpen = $('#btnOpenAi');

  let activeId = PROMPTS[0].id;

  renderChips();
  setActiveChip(activeId);

  const syncPrompt = () => { promptBox.value = buildPrompt(activeId, sourceText.value); };

  const syncProviderUI = () => {
    const p = getAiProvider();
    providerSel.value = p;
    const isCustom = p === 'custom';
    customBox.hidden = !isCustom;
    if(isCustom){
      aiLinkInput.value = safeUrl(localStorage.getItem(LS_AI_CUSTOM) || '') || '';
    } else {
      aiLinkInput.value = '';
    }
  };

  btnAi.addEventListener('click', () => {
    syncProviderUI();
    syncPrompt();
    dlg.showModal();
  });

  btnClose.addEventListener('click', () => dlg.close());

  providerSel.addEventListener('change', () => {
    const v = providerSel.value;
    customBox.hidden = (v !== 'custom');
  });

  $('#promptChips').addEventListener('click', (e) => {
    const t = e.target;
    if(!t.classList.contains('chip')) return;
    activeId = t.dataset.id;
    setActiveChip(activeId);
    syncPrompt();
  });

  sourceText.addEventListener('input', syncPrompt);

  btnSave.addEventListener('click', () => {
    const v = providerSel.value;
    const res = setAiProvider(v, aiLinkInput.value);
    toast(res.ok ? '已儲存 AI 入口' : res.msg);
    if(res.ok) syncProviderUI();
  });

  btnCopy.addEventListener('click', async () => {
    const ok = await copyToClipboard(promptBox.value);
    toast(ok ? '提示詞已複製' : '複製失敗，請手動選取');
  });

  btnOpen.addEventListener('click', () => {
    const p = getAiProvider();
    const url = (providerSel.value === 'custom' && safeUrl(aiLinkInput.value)) ? safeUrl(aiLinkInput.value) : getAiUrl(p);
    window.open(url, '_blank', 'noopener,noreferrer');
  });
}

(function boot(){
  console.log('[Angel Ebook Studio]', VERSION);

  // Sound buttons
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-sound]');
    if(!btn) return;
    playSound(btn.dataset.sound);
  });

  initAiDialog();

  // PWA
  if('serviceWorker' in navigator){
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
})();
