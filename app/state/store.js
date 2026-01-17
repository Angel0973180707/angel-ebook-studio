// app/state/store.js
export function createStore(){
  const KEY = 'angel_ebook_store_v2';
  let db = load() || { books: [], activeId: '' };

  function save(){ localStorage.setItem(KEY, JSON.stringify(db)); }
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||''); }catch(e){ return null; } }

  function uid(){ return 'book_' + Math.random().toString(36).slice(2,8); }

  function createBook(title='未命名書稿'){
    const now = Date.now();
    const book = {
      id: uid(),
      title,
      status: 'draft',
      updatedAt: now,
      pages: { idea:'', draft:'', final:'', ai:'' }
    };
    db.books.unshift(book);
    save();
    return book;
  }

  function updateBook(id, patch){
    const b = db.books.find(x=>x.id===id);
    if(!b) return;
    Object.assign(b, patch, { updatedAt: Date.now() });
    save();
  }

  function getBook(id){ return db.books.find(x=>x.id===id); }
  function getActiveBook(){ return db.books.find(x=>x.id===db.activeId); }
  function setActiveBook(id){ db.activeId = id; save(); }
  function removeBook(id){
    db.books = db.books.filter(x=>x.id!==id);
    if(db.activeId===id) db.activeId = db.books[0]?.id || '';
    save();
  }

  return { createBook, updateBook, getBook, getActiveBook, setActiveBook, removeBook };
}
