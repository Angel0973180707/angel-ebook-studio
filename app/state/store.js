// app/state/store.js
const LS_KEY = 'angel_ebook_books_v1';
const LS_CMD = 'angel_ebook_cmds_v1';

function safeJsonParse(str, fallback){
  try{ return JSON.parse(str); } catch(e){ return fallback; }
}
function now(){ return Date.now(); }
function uid(prefix='book'){
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export class Store{
  constructor(){
    this._books = this._loadBooks();
    this._cmds = this._loadCmds();
    if(!Array.isArray(this._books)) this._books = [];
    if(!Array.isArray(this._cmds)) this._cmds = [];
  }

  _loadBooks(){ return safeJsonParse(localStorage.getItem(LS_KEY), []); }
  _saveBooks(){ localStorage.setItem(LS_KEY, JSON.stringify(this._books)); }

  _loadCmds(){
    const init = [
      {
        id: 'cmd_talk_to_book',
        title: '口說稿 → 電子書書稿（去AI感）',
        hint: '把口說稿改成安靜可閱讀的書稿段落。',
        template:
`請把以下「口說稿」整理為【電子書書稿章節】，不是口說稿。
請去除口語填充與即時提問，調整成適合安靜閱讀的段落節奏（可短段、可留白）。
不要使用「首先其次最後」或總結式套語，避免AI感。
結構：開場感受 → 理解鋪陳 → 轉彎洞見 → 溫柔收束（不說教、不下結論）。
以下是口說稿：\n\n{{CONTENT}}`
      }
    ];
    const v = safeJsonParse(localStorage.getItem(LS_CMD), null);
    if(Array.isArray(v) && v.length) return v;
    return init;
  }
  _saveCmds(){ localStorage.setItem(LS_CMD, JSON.stringify(this._cmds)); }

  listBooks(){ return [...this._books].sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0)); }

  createBook(){
    const b = {
      id: uid('book'),
      title: '未命名的書',
      status: 'draft',
      inspiration: '',
      draft: '',
      final: '',
      aiNotes: '',
      createdAt: now(),
      updatedAt: now()
    };
    this._books.push(b);
    this._saveBooks();
    return b.id;
  }

  deleteBook(id){
    const n = this._books.length;
    this._books = this._books.filter(b => b.id !== id);
    if(this._books.length !== n) this._saveBooks();
  }

  getBook(id){ return this._books.find(b => b.id === id) || null; }

  updateBook(id, patch){
    const b = this.getBook(id);
    if(!b) return false;
    Object.assign(b, patch);
    b.updatedAt = now();
    this._saveBooks();
    return true;
  }

  toggleStatus(id){
    const b = this.getBook(id);
    if(!b) return false;
    b.status = (b.status === 'published') ? 'draft' : 'published';
    b.updatedAt = now();
    this._saveBooks();
    return true;
  }

  exportBook(id){
    const b = this.getBook(id);
    if(!b) return null;
    return { schema: 'angel-ebook-book-v1', exportedAt: now(), book: b };
  }

  importBook(obj){
    if(!obj || obj.schema !== 'angel-ebook-book-v1' || !obj.book) return { ok:false, msg:'檔案格式不正確' };
    const incoming = obj.book;
    const newId = uid('book');
    const b = {
      id: newId,
      title: String(incoming.title || '匯入的書'),
      status: (incoming.status === 'published') ? 'published' : 'draft',
      inspiration: String(incoming.inspiration || ''),
      draft: String(incoming.draft || ''),
      final: String(incoming.final || ''),
      aiNotes: String(incoming.aiNotes || ''),
      createdAt: now(),
      updatedAt: now()
    };
    this._books.push(b);
    this._saveBooks();
    return { ok:true, id:newId };
  }

  listCmds(){ return [...this._cmds]; }
}
