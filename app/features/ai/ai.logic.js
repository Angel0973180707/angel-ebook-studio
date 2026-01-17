import { AI_DEFAULTS, AI_STATES, AI_LENSES } from '../../core/constants.js';
import { $, $$, toast, copyToClipboard } from '../../core/utils.js';
import { loadAILibrary, saveAILibrary, loadAITemp, saveAITemp, loadUIPref, saveUIPref } from '../../core/store.js';
import { aiDrawerHTML } from './ai.view.js';

let mounted = false;
let ctx = null; // {bookId, bookTitle, activeTab, sourceText, aiTemp}

export function setAIDrawerContext(next){
  ctx = next;
}

function stateText(key){
  const s = AI_STATES.find(x=>x.key===key);
  if(!s) return '';
  if(key==='stability') return '請以「自我穩定」狀態整理內容。\n不催促、不拉扯，不要求改變。\n只是站穩，讓事情被看清楚。';
  if(key==='ease') return '請以「自在感」狀態整理內容。\n移除內在要求與必須，讓文字帶出鬆開與允許。';
  if(key==='potential') return '請以「潛能正在流動」的狀態整理內容。\n不灌雞湯、不勵志，呈現卡點鬆開後的自然流動。';
  if(key==='agency') return '請以「增加我能感」的狀態整理內容。\n不要求行動，只呈現下一小步是可行的。';
  return '';
}

function lensText(key){
  if(key==='philosophy') return '請從「哲思」角度觀看與整理：關注存在、觀看與理解，不急著給答案。';
  if(key==='micro_science') return '請從「微科學」角度觀看與整理：用白話說清系統怎麼跑，不炫名詞、不像教科書。';
  if(key==='parenting') return '請從「教養／關係」角度觀看與整理：用情境呈現互動，課題分離，不評對錯。';
  if(key==='venting') return '請從「舒發」角度觀看與整理：讓感覺被說出來，不分析、不診斷。';
  return '';
}

function composePrompt({ stateKey, lensKey, task, sourceText, aiTemp }){
  const lines = [];
  lines.push('在本次協作中，請你遵守以下隱性原則（不用說明，直接體現在文字裡）：');
  lines.push('【共通原則】');
  lines.push('- 不說教、不總結、不提醒');
  lines.push('- 段落可短，可留白');
  lines.push('- 像一個人在慢慢想，而不是在教');
  lines.push('- 不製造焦慮，不綁住使用者');
  lines.push('');
  lines.push('【狀態｜State】');
  lines.push(stateText(stateKey));
  lines.push('');
  lines.push('【角度｜Lens】');
  lines.push(lensText(lensKey));

  if(aiTemp && aiTemp.trim()){
    lines.push('');
    lines.push('【本書臨時指派（供參考，可擇要採用）】');
    lines.push(aiTemp.trim());
  }

  if(task && task.trim()){
    lines.push('');
    lines.push('【本次任務】');
    lines.push(task.trim());
  }

  lines.push('');
  lines.push('【內容】');
  lines.push(sourceText && sourceText.trim() ? sourceText.trim() : '（目前分頁內容是空白，你可以請我先貼上文字再協作）');

  return lines.join('\n');
}

function renderLibrary(lib){
  const box = $('#aiLibrary');
  if(!box) return;
  const pinned = lib.pinned || [];
  const items = lib.items || {};
  const list = pinned.map(id=>items[id]).filter(Boolean);

  const html = list.length ? list.map(it=>`
    <div class="libItem" data-lib-id="${it.id}">
      <div class="libMain">
        <div class="libTitle">${escapeHtmlLite(it.title||'未命名')}</div>
        <div class="libSub">點一下就會把內容塞進「任務」</div>
      </div>
      <div class="libActions">
        <button class="btn small ghost" data-action="insert" type="button">插入</button>
        <button class="btn small danger" data-action="remove" type="button">移除</button>
      </div>
    </div>
  `).join('') : `<div class="empty"><div class="emptyTitle">指令庫目前只有一條預設</div><div class="emptySub">你可以把常用指令存進來。</div></div>`;

  box.innerHTML = html;
}

function escapeHtmlLite(s){
  return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

export function mountAIDrawer(){
  if(mounted) return;
  mounted = true;

  const ui = loadUIPref();
  const provider = ui.ai_provider || AI_DEFAULTS.provider;
  const stateKey = ui.ai_state || AI_DEFAULTS.state;
  const lensKey = ui.ai_lens || AI_DEFAULTS.lens;

  const host = document.createElement('div');
  host.id = 'aiRoot';
  document.body.appendChild(host);
  host.innerHTML = aiDrawerHTML({ provider, stateKey, lensKey, hasContext: !!ctx });

  const drawer = $('#aiDrawer', host);
  const task = $('#aiTask', host);
  const result = $('#aiResult', host);

  const lib = loadAILibrary();
  renderLibrary(lib);

  function open(on){
    drawer.classList.toggle('open', !!on);
    drawer.setAttribute('aria-hidden', on ? 'false' : 'true');
    document.body.style.overflow = on ? 'hidden' : '';
    if(on) task?.focus();
  }

  function readChoice(name){
    const el = host.querySelector(`input[name="${name}"]:checked`);
    return el?.value;
  }

  function saveUIPrefs(){
    ui.ai_provider = readChoice('ai_provider');
    ui.ai_state = readChoice('ai_state');
    ui.ai_lens = readChoice('ai_lens');
    saveUIPref(ui);
  }

  function doCompose(){
    saveUIPrefs();
    const prompt = composePrompt({
      stateKey: ui.ai_state,
      lensKey: ui.ai_lens,
      task: task?.value || '',
      sourceText: ctx?.sourceText || '',
      aiTemp: ctx?.aiTemp || ''
    });
    result.value = prompt;
    toast('已產生協作指令');
  }

  async function doCopy(){
    const txt = (result.value || '').trim();
    if(!txt){ toast('先產生指令'); return; }
    const ok = await copyToClipboard(txt);
    toast(ok ? '已複製' : '複製失敗（可手動全選複製）');
  }

  function openProvider(){
    saveUIPrefs();
    const p = AI_DEFAULTS.providers.find(x=>x.key===ui.ai_provider) || AI_DEFAULTS.providers[0];
    window.open(p.url, '_blank', 'noopener');
    toast(`已開啟 ${p.name}`);
  }

  function saveToTemp(){
    if(!ctx?.bookId){ alert('回到某一本書的編輯頁，才能存到本書 AI 指派。'); return; }
    const txt = (result.value || '').trim();
    if(!txt){ toast('沒有內容可存'); return; }

    // store as a single item (append as one block header)
    const existing = loadAITemp(ctx.bookId);
    existing.unshift(`【${new Date().toLocaleString()}】\n${txt}`);
    saveAITemp(ctx.bookId, existing);

    // also reflect into current editor ai_temp textarea if present
    const aiField = document.querySelector('#app [data-field="ai_temp"]');
    if(aiField){
      const arr = existing;
      aiField.value = arr.join('\n\n');
    }

    // update context
    ctx.aiTemp = document.querySelector('#app [data-field="ai_temp"]')?.value || ctx.aiTemp;
    toast('已存到本書 AI 指派');
  }

  function saveToLibrary(){
    const txt = (result.value || '').trim();
    if(!txt){ toast('先產生指令'); return; }
    const title = prompt('給這條指令取個名稱（指令庫用）', '自訂協作指令');
    if(!title) return;

    const libNow = loadAILibrary();
    const id = `cmd_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
    libNow.items[id] = { id, title: title.trim(), body: txt };
    libNow.pinned = Array.from(new Set([id, ...(libNow.pinned||[])]));
    saveAILibrary(libNow);
    renderLibrary(libNow);
    toast('已存到指令庫');
  }

  host.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-action]');
    if(!btn) return;
    const action = btn.dataset.action;

    if(action==='close') return open(false);
    if(action==='compose') return doCompose();
    if(action==='copy') return doCopy();
    if(action==='open_provider') return openProvider();
    if(action==='save_to_temp') return saveToTemp();
    if(action==='save_to_library') return saveToLibrary();

    // library actions
    const libItem = e.target.closest('.libItem');
    if(libItem){
      const id = libItem.dataset.libId;
      const libNow = loadAILibrary();
      const it = libNow.items?.[id];
      if(!it) return;

      if(action==='insert'){
        task.value = it.body || '';
        toast('已插入任務');
        return;
      }
      if(action==='remove'){
        if(!confirm('要從指令庫移除這條嗎？')) return;
        delete libNow.items[id];
        libNow.pinned = (libNow.pinned||[]).filter(x=>x!==id);
        saveAILibrary(libNow);
        renderLibrary(libNow);
        toast('已移除');
        return;
      }
    }
  });

  host.addEventListener('change', (e)=>{
    const t = e.target;
    if(!(t instanceof HTMLInputElement)) return;
    if(['ai_provider','ai_state','ai_lens'].includes(t.name)){
      saveUIPrefs();
    }
  });

  // escape key
  window.addEventListener('keydown', (e)=>{
    if(e.key==='Escape' && drawer.classList.contains('open')) open(false);
  });

  window.__AES_AI__ = {
    toggle: open,
    compose: doCompose
  };
}
