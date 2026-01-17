// app/features/ai/ai.logic.js
import { aiDrawerHTML } from './ai.view.js';

const LS_AI_PROMPTS = 'angel_ai_prompts_v1';

function safeParse(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

function loadPrompts() {
  return safeParse(localStorage.getItem(LS_AI_PROMPTS), [
    {
      title: '幫我排結構（起承轉合）',
      desc: '把這篇草稿整理成「開場/轉折/落地/收束」四段結構，每段一句重點。'
    },
    {
      title: '口說長片稿',
      desc: '把這段改成我可以直接對鏡頭講的口說稿：句子短、語速慢、留白感。'
    },
    {
      title: 'Angel 風格定稿',
      desc: '幫我潤稿成「不說教、溫柔但篤定」的文字，語句順、有畫面感，不浮誇。'
    }
  ]);
}

function savePrompts(list) {
  localStorage.setItem(LS_AI_PROMPTS, JSON.stringify(list));
}

export function mountAI({ btnSelector = '#btnAi' } = {}) {
  const btn = document.querySelector(btnSelector);
  if (!btn) return;

  // 只綁一次
  if (btn.dataset.bound === '1') return;
  btn.dataset.bound = '1';

  btn.addEventListener('click', () => openDrawer());
}

function openDrawer() {
  const prompts = loadPrompts();

  // 建立容器（避免跟你的書庫 root 互相覆蓋）
  let host = document.getElementById('aiHost');
  if (!host) {
    host = document.createElement('div');
    host.id = 'aiHost';
    document.body.appendChild(host);
  }

  host.innerHTML = aiDrawerHTML({ prompts });

  // ✅ 鎖住頁面滾動，但抽屜內要能滾
  document.documentElement.classList.add('aiOpen');
  document.body.classList.add('aiOpen');

  // 事件委派
  host.onclick = (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;

    const act = el.dataset.action;
    if (act === 'close') return closeDrawer();

    if (act === 'new') {
      const title = prompt('臨時指派：標題（可空）') || '臨時指派';
      const desc = prompt('寫下你要我做什麼（會存起來）') || '';
      const list = loadPrompts();
      list.unshift({ title, desc });
      savePrompts(list);
      openDrawer(); // 重新渲染
      return;
    }

    if (act === 'library') {
      alert('指令庫 v1：目前就是這個清單（可新增/刪除）。之後我們再做分類與匯出。');
      return;
    }

    if (act === 'remove') {
      const idx = Number(el.dataset.idx);
      const list = loadPrompts();
      list.splice(idx, 1);
      savePrompts(list);
      openDrawer();
      return;
    }

    if (act === 'apply') {
      const idx = Number(el.dataset.idx);
      const p = loadPrompts()[idx];
      // v1：先複製到剪貼簿（你之後要套用到編輯器，我們再接）
      copyText(`${p.title}\n${p.desc}`.trim());
      toast('已複製指令（可貼到 ChatGPT / Gemini）');
      return;
    }
  };

  // ✅ 重要：不要在這裡對 touchmove 做 preventDefault
  // 只要 CSS 的 aiBody 有 overflow，就能滑
}

function closeDrawer() {
  const host = document.getElementById('aiHost');
  if (host) host.innerHTML = '';
  document.documentElement.classList.remove('aiOpen');
  document.body.classList.remove('aiOpen');
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 1600);
}