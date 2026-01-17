import { $, $$, now, toast, downloadText, readFileAsText } from '../../core/utils.js';
import { loadBooks, saveBooks, loadBookContent, saveBookContent, loadAITemp, saveAITemp, loadUIPref, saveUIPref } from '../../core/store.js';
import { editorHTML } from './editor.view.js';

export function mountEditor(root, bookId){
  const books = loadBooks();
  const book = books.find(b=>b.id===bookId);
  if(!book){
    root.innerHTML = `<section class="panel"><div class="h2">找不到這本書</div><div class="sub">回到書庫重新選擇</div></section>`;
    return;
  }

  const ui = loadUIPref();
  const activeTab = ui[`tab_${bookId}`] || 'draft';

  const content = loadBookContent(bookId);
  const aiTemp = loadAITemp(bookId).join('\n');

  root.innerHTML = editorHTML({ book, content, activeTab });

  const titleInput = $('[data-role="title"]', root);
  const fileImport = $('#fileImport', root);

  // fill ai temp field
  const aiField = $('[data-field="ai_temp"]', root);
  if(aiField) aiField.value = aiTemp;

  function setActiveTab(tab){
    ui[`tab_${bookId}`] = tab;
    saveUIPref(ui);
    $$('.tab', root).forEach(b=> b.classList.toggle('active', b.dataset.tab===tab));
    $$('.tabPanel', root).forEach(p=> p.classList.toggle('show', p.dataset.panel===tab));

    // update AI context: which text to use
    updateAIContext();
  }

  function saveTitle(){
    book.title = (titleInput.value || '未命名書稿').trim();
    book.updatedAt = now();
    saveBooks(books);
  }

  function saveField(field, value){
    content[field] = value;
    saveBookContent(bookId, content);
    book.updatedAt = now();
    saveBooks(books);
  }

  function updateAIContext(){
    const tab = ui[`tab_${bookId}`] || 'draft';
    let text = '';
    if(tab === 'inspiration') text = content.inspiration || '';
    else if(tab === 'draft') text = content.draft || '';
    else if(tab === 'final') text = content.final || '';
    else text = '';

    // current AI temp as notes
    const temp = $('[data-field="ai_temp"]', root)?.value || '';

    window.AES?.setAIContext?.({
      bookId,
      bookTitle: book.title,
      activeTab: tab,
      sourceText: text,
      aiTemp: temp
    });
  }

  // listeners
  root.addEventListener('click', (e)=>{
    const tabBtn = e.target.closest('.tab');
    if(tabBtn){
      setActiveTab(tabBtn.dataset.tab);
      return;
    }

    const btn = e.target.closest('button[data-action]');
    if(!btn) return;
    const action = btn.dataset.action;

    if(action === 'rename'){
      titleInput.focus();
      titleInput.select();
      return;
    }

    if(action === 'export'){
      const payload = {
        kind: 'angel-ebook-studio-book',
        version: 1,
        book: { ...book },
        content: { ...content },
        aiTemp: ($('[data-field="ai_temp"]', root)?.value || '').split(/\n+/).map(s=>s.trim()).filter(Boolean)
      };
      const nameSafe = (book.title || 'ebook').replace(/[^\w\u4e00-\u9fa5-]+/g,'_').slice(0,60);
      downloadText(`${nameSafe}.json`, JSON.stringify(payload, null, 2));
      toast('已匯出');
      return;
    }

    if(action === 'import'){
      fileImport.value = '';
      fileImport.click();
      return;
    }

    if(action === 'ai_open'){
      // open drawer
      document.getElementById('btnAi')?.click();
      return;
    }

    if(action === 'ai_save'){
      const txt = ($('[data-field="ai_temp"]', root)?.value || '').trim();
      const arr = txt ? txt.split(/\n+/).map(s=>s.trim()).filter(Boolean) : [];
      saveAITemp(bookId, arr);
      toast('已存到臨時指派');
      updateAIContext();
      return;
    }
  }, { passive: true });

  root.addEventListener('input', (e)=>{
    const t = e.target;
    if(t.matches('[data-role="title"]')){
      saveTitle();
      updateAIContext();
      return;
    }
    if(t.matches('textarea[data-field]')){
      const field = t.dataset.field;
      if(field === 'ai_temp'){
        // don't spam localStorage on every key; still ok, but keep light
        return;
      }
      saveField(field, t.value);
      updateAIContext();
    }
  });

  fileImport.addEventListener('change', async ()=>{
    const f = fileImport.files?.[0];
    if(!f) return;
    try{
      const txt = await readFileAsText(f);
      const obj = JSON.parse(txt);
      if(obj?.kind !== 'angel-ebook-studio-book') throw new Error('檔案格式不對');

      // merge
      const bc = obj.content || {};
      content.inspiration = String(bc.inspiration || '');
      content.draft = String(bc.draft || '');
      content.final = String(bc.final || '');
      saveBookContent(bookId, content);

      const aiArr = Array.isArray(obj.aiTemp) ? obj.aiTemp.map(s=>String(s)) : [];
      saveAITemp(bookId, aiArr);
      const aiField2 = $('[data-field="ai_temp"]', root);
      if(aiField2) aiField2.value = aiArr.join('\n');

      toast('已匯入');
      updateAIContext();
    }catch(e){
      alert(`匯入失敗：${e.message || e}`);
    }
  });

  // initial context
  updateAIContext();
}
