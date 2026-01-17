import { renderAIPanel } from './ai.view.js';

export function initAI(){
  const btn = document.getElementById('btnAi');
  btn.addEventListener('click', renderAIPanel);
}
