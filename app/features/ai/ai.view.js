export function renderAIPanel(){
  const div = document.createElement('div');
  div.id = 'ai-panel';
  div.innerHTML = '<p>AI 協作面板已啟動</p>';
  document.body.appendChild(div);
}
