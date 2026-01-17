import { uid, now, toast } from '../../core/utils.js';
import { loadBooks, saveBooks, saveBookContent } from '../../core/store.js';
import { bookshelfHTML } from './bookshelf.view.js';

export function mountBookshelf(root){
  const state = { books: loadBooks() };

  function render(){
    // newest first
    const books = [...state.books].sort((a,b)=> (b.updatedAt||0)-(a.updatedAt||0));
    root.innerHTML = bookshelfHTML({ books });
  }

  function newBook(){
    const id = uid('book');
    const book = {
      id,
      title: '未命名書稿',
      status: 'draft',
      createdAt: now(),
      updatedAt: now()
    };
    state.books.unshift(book);
    saveBooks(state.books);
    saveBookContent(id, { inspiration:'', draft:'', final:'' });
    toast('已新增一本書');
    location.hash = `#/edit/${id}`;
  }

  root.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-action]');
    if(!btn) return;
    const action = btn.dataset.action;
    if(action === 'newBook') return newBook();
    const item = e.target.closest('.bookItem');
    const id = item?.dataset.bookId;
    if(!id) return;
    const idx = state.books.findIndex(b=>b.id===id);
    if(idx<0) return;

    if(action === 'open'){
      location.hash = `#/edit/${id}`;
      return;
    }
    if(action === 'toggleStatus'){
      const b = state.books[idx];
      b.status = (b.status === 'published') ? 'draft' : 'published';
      b.updatedAt = now();
      saveBooks(state.books);
      toast('已切換狀態');
      render();
      return;
    }
    if(action === 'delete'){
      if(!confirm('確定要刪除這本書？（內容也會一併刪除）')) return;
      state.books.splice(idx,1);
      saveBooks(state.books);
      localStorage.removeItem(`aes_book_${id}_content_v1`);
      localStorage.removeItem(`aes_book_${id}_ai_temp_v1`);
      toast('已刪除');
      render();
      return;
    }
  }, { passive: true });

  render();
}
