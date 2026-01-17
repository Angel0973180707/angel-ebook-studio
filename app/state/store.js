// app/state/store.js
const LS_KEY = 'angel_ebook_books_v1';
const LS_MY_CMD = 'angel_ebook_my_cmds_v1';
const LS_PINS = 'angel_ebook_cmd_pins_v1';

// Built-in AI command library (v1.0)
// - Tone: mixed (D)
// - Exercise label: 小練功
// - Exercise pacing: mixed (30–60s × 1–3min)
// Built-ins are code-defined (not stored). Users can add/backup their own “My Commands”.
const BUILTIN_LIBRARY = {
  schema: 'angel-ai-library-v1',
  meta: {
    version: 'v1.0',
    defaultTone: 'mixed-D',
    exerciseLabel: '小練功',
    exercisePacing: 'mixed'
  },
  groups: [
    {
      id: 'quick',
      title: '快速指令（置頂）',
      items: [
        {
          id: 'spoken-to-book-chapter',
          title: '口說稿 → 書稿（章節版｜去AI感）',
          hint: '把口說稿/逐字稿改成可直接進電子書的章節內容（混合讀者）。',
          prompt:
            '你是一位溫柔而篤定的編輯者，熟悉親子教養、心理與腦科學，也懂得以哲思提問。請把以下口說稿/逐字稿改寫為電子書章節，遵守：1) 章標題(10–18字)；2) 開場畫面段(80–120字)；3) 核心概念(自我穩定/自在感/我能感)；4) 微科學角度(生活例子、不堆術語)；5) 教養/關係角度(給一句可說出口的話)；6) 哲思留白(用提問)；7) 小練功(依章節自動給30–60s或1–3min，必要時兩者，結尾語氣自動切)；8) 章末小結(很短)。禁用首先/其次/總結；少條列；自然停頓。輸入內容如下：'
        },
        {
          id: 'de-ai-polish',
          title: '去 AI 感潤稿（人味版）',
          hint: '去掉AI句型、說教轉折，保留畫面與呼吸。',
          prompt:
            '請將以下文字去除AI句型與說教感：減少條列、避免總結式轉折；加入生活畫面與自然停頓；保留溫柔但不煽情。篇幅不拉長。輸入如下：'
        },
        {
          id: 'non-spoken-style',
          title: '一鍵改成非口說語體',
          hint: '把鏡頭語改成書寫語，但仍保留親密感。',
          prompt:
            '將下文的鏡頭語/口語轉為書寫語，保留親密感與節奏，不提影片/聽眾。輸入如下：'
        },
        {
          id: 'chapter-outline-12',
          title: '書稿大綱（12章）',
          hint: '從素材長出目錄，每章一句主旨＋收穫＋小練功方向。',
          prompt:
            '依下列素材生成12章目錄：每章一句主旨＋讀者收穫＋對應小練功方向（30–60s或1–3min）。避免口號。素材如下：'
        },
        {
          id: 'exercise-mixed',
          title: '章節小練功（混合配速）',
          hint: '自動產出30–60秒＋（必要時）1–3分鐘穩定儀式。',
          prompt:
            '針對下文章節內容，產出小練功：① 即刻可做30–60s（一句引導語＋一個身體動作）；② 視章節重量加上1–3min穩定儀式（呼吸/書寫/一句可說出口的話）。語氣混合，結尾依章節自動切。內容如下：'
        }
      ]
    },
    {
      id: 'structure',
      title: '結構整理',
      items: [
        {
          id: 'arc-rebuild',
          title: '起承轉合重排',
          hint: '每段給一句重點句＋一句留白句。',
          prompt:
            '請將下文重排為起承轉合，每段給一句重點句＋一句留白句。避免說教。內容如下：'
        },
        {
          id: 'short-paragraphs',
          title: '段落精修（80–120字）',
          hint: '切成短段、每段一畫面、節奏穩。',
          prompt:
            '把下文切成80–120字短段，每段一個畫面，句子短、節奏穩。內容如下：'
        }
      ]
    },
    {
      id: 'angles',
      title: '多角度擴寫',
      items: [
        {
          id: 'philosophy',
          title: '哲思角度擴寫',
          hint: '用提問與留白，不下結論。',
          prompt:
            '以提問與留白方式擴寫哲思層次，不下結論。內容如下：'
        },
        {
          id: 'neuro',
          title: '腦科學角度擴寫',
          hint: '用生活例子解釋，不堆術語。',
          prompt:
            '用生活例子解釋心理/腦科學概念，不堆術語。內容如下：'
        },
        {
          id: 'parenting',
          title: '教養/關係角度擴寫',
          hint: '轉成親子/關係現場，給一句可說出口的話。',
          prompt:
            '轉為親子或關係現場，提供一句可說出口的話。內容如下：'
        },
        {
          id: 'release',
          title: '舒發療癒角度擴寫',
          hint: '命名感受→允許→身體放鬆→小行動。',
          prompt:
            '引導情緒出口：命名感受→允許→身體放鬆→小行動。內容如下：'
        }
      ]
    },
    {
      id: 'exercises',
      title: '小練功工具',
      items: [
        {
          id: 'emergency-30s',
          title: '30秒現場急救',
          hint: '呼吸＋一句話＋下一步行動。',
          prompt:
            '給一個30–60秒的小練功：呼吸＋一句話＋下一步行動。情境如下：'
        },
        {
          id: 'ritual-1-3',
          title: '穩定儀式（1–3分鐘）',
          hint: '呼吸/書寫/一句可說出口的話。',
          prompt:
            '產出1–3分鐘穩定儀式（呼吸/書寫/一句可說出口的話），語氣溫柔但可做。內容如下：'
        },
        {
          id: 'toolbox-5',
          title: '自我穩定工具箱（5卡）',
          hint: '我能感/界線/選擇/放下/回到呼吸。',
          prompt:
            '生成5張工具卡（我能感/界線/選擇/放下/回到呼吸），每卡2句話。內容如下：'
        }
      ]
    },
    {
      id: 'outputs',
      title: '成品輸出',
      items: [
        {
          id: 'chapter-homework',
          title: '章末小作業（溫柔版）',
          hint: '不評分的小作業3題。',
          prompt:
            '產出不評分的小作業3題（覺察/選擇/行動）。內容如下：'
        },
        {
          id: 'golden-lines',
          title: '金句提煉（10句）',
          hint: '12–18字，溫柔但有力。',
          prompt:
            '提煉10句金句（12–18字），溫柔但有力。內容如下：'
        },
        {
          id: 'reader-invite',
          title: '導讀文（邀請）',
          hint: '100–150字，不推銷、不說教。',
          prompt:
            '寫100–150字導讀，不推銷、不說教，像牽讀者的手。內容如下：'
        }
      ]
    }
  ]
};

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
    this._myCmds = this._loadMyCmds();
    this._pins = this._loadPins();
    if(!Array.isArray(this._books)) this._books = [];
    if(!Array.isArray(this._myCmds)) this._myCmds = [];
    if(!Array.isArray(this._pins)) this._pins = [];
  }

  _loadBooks(){ return safeJsonParse(localStorage.getItem(LS_KEY), []); }
  _saveBooks(){ localStorage.setItem(LS_KEY, JSON.stringify(this._books)); }

  _loadMyCmds(){
    const v = safeJsonParse(localStorage.getItem(LS_MY_CMD), []);
    return Array.isArray(v) ? v : [];
  }
  _saveMyCmds(){ localStorage.setItem(LS_MY_CMD, JSON.stringify(this._myCmds)); }

  _loadPins(){
    const v = safeJsonParse(localStorage.getItem(LS_PINS), []);
    return Array.isArray(v) ? v : [];
  }
  _savePins(){ localStorage.setItem(LS_PINS, JSON.stringify(this._pins)); }

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

  // --- AI command library ---
  getBuiltinLibrary(){ return BUILTIN_LIBRARY; }

  listMyCmds(){
    return [...this._myCmds].sort((a,b) => (b.updatedAt||0)-(a.updatedAt||0));
  }

  _isValidCmdPayload(p){
    if(!p) return false;
    const title = String(p.title || '').trim();
    const prompt = String(p.prompt || '').trim();
    if(!title || !prompt) return false;
    return true;
  }

  addMyCmd(payload){
    if(!this._isValidCmdPayload(payload)) return { ok:false, msg:'標題與指令內容不可空白' };
    const cmd = {
      id: uid('mycmd'),
      title: String(payload.title).trim().slice(0, 80),
      hint: String(payload.hint || '').trim().slice(0, 140),
      prompt: String(payload.prompt).trim(),
      tags: Array.isArray(payload.tags) ? payload.tags.map(x=>String(x)).slice(0,8) : [],
      createdAt: now(),
      updatedAt: now()
    };
    this._myCmds.unshift(cmd);
    this._saveMyCmds();
    return { ok:true, id: cmd.id };
  }

  updateMyCmd(id, patch){
    const c = this._myCmds.find(x => x.id === id);
    if(!c) return false;
    if('title' in patch) c.title = String(patch.title||'').trim().slice(0,80) || c.title;
    if('hint' in patch) c.hint = String(patch.hint||'').trim().slice(0,140);
    if('prompt' in patch) c.prompt = String(patch.prompt||'').trim() || c.prompt;
    if('tags' in patch) c.tags = Array.isArray(patch.tags) ? patch.tags.map(x=>String(x)).slice(0,8) : c.tags;
    c.updatedAt = now();
    this._saveMyCmds();
    return true;
  }

  deleteMyCmd(id){
    const n = this._myCmds.length;
    this._myCmds = this._myCmds.filter(c => c.id !== id);
    if(this._myCmds.length !== n){
      this._saveMyCmds();
      // also unpin
      this._pins = this._pins.filter(x => x !== id);
      this._savePins();
    }
  }

  listPins(){ return [...this._pins]; }
  isPinned(id){ return this._pins.includes(id); }

  togglePin(id){
    const idx = this._pins.indexOf(id);
    if(idx >= 0){
      this._pins.splice(idx,1);
      this._savePins();
      return { ok:true, pinned:false };
    }
    if(this._pins.length >= 7) return { ok:false, msg:'釘選最多 7 條' };
    this._pins.unshift(id);
    this._savePins();
    return { ok:true, pinned:true };
  }

  // Flatten all commands (built-in + my)
  listAllCmds(){
    const built = BUILTIN_LIBRARY.groups.flatMap(g => g.items.map(it => ({...it, _source:'builtin', groupId:g.id, groupTitle:g.title})));
    const mine = this.listMyCmds().map(it => ({...it, _source:'mine', groupId:'mine', groupTitle:'我的指令'}));
    return [...built, ...mine];
  }

  // Groups for UI (built-in groups + my)
  listCmdGroups(){
    const myGroup = {
      id: 'mine',
      title: '我的指令',
      items: this.listMyCmds().map(c => ({
        id: c.id,
        title: c.title,
        hint: c.hint,
        prompt: c.prompt,
        tags: c.tags,
        _source: 'mine'
      }))
    };
    const gs = BUILTIN_LIBRARY.groups.map(g => ({
      id: g.id,
      title: g.title,
      items: g.items.map(it => ({...it, _source:'builtin'}))
    }));
    return [...gs, myGroup];
  }

  exportAiLibrary(){
    return {
      schema: 'angel-ai-library-export-v1',
      exportedAt: now(),
      meta: BUILTIN_LIBRARY.meta,
      myCmds: this.listMyCmds(),
      pins: this.listPins()
    };
  }

  importAiLibrary(obj){
    if(!obj || obj.schema !== 'angel-ai-library-export-v1') return { ok:false, msg:'檔案格式不正確' };
    const myCmds = Array.isArray(obj.myCmds) ? obj.myCmds : [];
    const pins = Array.isArray(obj.pins) ? obj.pins : [];
    // sanitize minimal
    this._myCmds = myCmds
      .filter(c => c && c.id && c.title && c.prompt)
      .map(c => ({
        id: String(c.id),
        title: String(c.title).slice(0,80),
        hint: String(c.hint||'').slice(0,140),
        prompt: String(c.prompt||''),
        tags: Array.isArray(c.tags) ? c.tags.map(x=>String(x)).slice(0,8) : [],
        createdAt: now(),
        updatedAt: now()
      }));
    this._pins = pins.map(x=>String(x)).slice(0,7);
    this._saveMyCmds();
    this._savePins();
    return { ok:true };
  }
}
