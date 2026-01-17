import { initStore } from './core/store.js';
import { initAI } from './features/ai/ai.logic.js';

const app = document.getElementById('app');

function renderHome(){
  app.innerHTML = `
    <section style="padding:24px">
      <h2>📚 Angel Ebook Studio</h2>
      <p>這是一個電子書協作與創作空間。</p>

      <div style="margin-top:16px">
        <button id="btnNewBook">＋ 新增一本書</button>
      </div>

      <p style="margin-top:24px;opacity:.6">
        （書庫、編輯器、封面、閱讀模式將逐步啟用）
      </p>
    </section>
  `;
}

console.log('Angel Ebook Studio booting...');
initStore();
initAI();
renderHome();