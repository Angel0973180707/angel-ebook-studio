// app/main.js
const root = document.getElementById('app');

function escapeHTML(s){
  return String(s ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;');
}

function show(title, msg) {
  root.innerHTML = `
    <section style="padding:24px; line-height:1.65;">
      <div style="font-size:18px; font-weight:800; margin-bottom:10px;">${escapeHTML(title)}</div>
      <pre style="white-space:pre-wrap; opacity:.92;">${escapeHTML(msg)}</pre>
      <div style="margin-top:14px; opacity:.85; font-size:12px;">
        Tip：若你剛更新 GitHub Pages，有時需「硬重整」或等幾分鐘快取更新。
      </div>
    </section>
  `;
}

async function mountAIButton() {
  // AI 模組永遠不致命：不存在就跳過
  try {
    const ai = await import('./features/ai/ai.logic.js');
    if (ai?.mountAI) ai.mountAI({ btnSelector: '#btnAi' });
  } catch (e) {
    console.warn('AI skipped:', e);
  }
}

function parseHash() {
  const raw = (location.hash || '').replace(/^#/, '').trim();
  if (!raw || raw === '/' || raw === 'books') return { name: 'books' };
  const p = raw.split('/').filter(Boolean);
  if (p[0] === 'edit' && p[1]) return { name: 'edit', bookId: p[1] };
  if (p[0] === 'books') return { name: 'books' };
  return {