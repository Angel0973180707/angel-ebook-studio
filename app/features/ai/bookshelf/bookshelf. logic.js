import { uid, now } from '../../core/utils.js';
import { getBooks, saveBook, deleteBook } from '../../core/store.js';
import { bookshelfHTML } from './bookshelf.view.js';

export function mountBookshelf(appEl){
  let books = [];

  async function refresh(){
    books = await getBooks();
    // 最新更新排前面
    books.sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0));
    appEl.innerHTML = bookshelfHTML({ books });
  }

  async function onAction(action, bookId){
    if(action === 'newBook'){
      const title = prompt('書名（可先留空，之後再改）', '我的新書');
      const t = (title || '').trim() || '我的新書';
      const book = {
        id: uid('book'),
        title: t,
        status: 'draft', // draft | published
        createdAt: now(),
        updatedAt: now(),
        version: 1
      };
      await saveBook(book);
      await refresh();
      return;
    }

    if(!bookId) return;
    const book = books.find(b => b.id === bookId);
    if(!book) return;

    if(action === 'toggleStatus'){
      const next = book.status === 'published' ? 'draft' : 'published';
      await saveBook({ ...book, status: next, updatedAt: now() });
      await refresh();
      return;
    }

    if(action === 'delete'){
      const ok = confirm(`確定刪除「${book.title}」？\n（這一步無法復原）`);
      if(!ok) return;
      await deleteBook(bookId);
      await refresh();
      return;
    }

    if(action === 'open'){
      // 先做占位：之後接「書本概覽 / 章節列表 / 編輯器」
      alert(`即將開啟：${book.title}\n\n下一步我會幫你接：章節/圖文編輯器。`);
      return;
    }
  }

  // 事件委派：全站只要一個監聽
  appEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if(!btn) return;
    const action = btn.dataset.action;
    const card = btn.closest('[data-book-id]');
    const bookId = card ? card.dataset.bookId : null;
    onAction(action, bookId);
  });

  // 首次渲染
  refresh();
}
