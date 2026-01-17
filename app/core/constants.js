export const APP_VERSION = 'v1.1.0';

export const LS_KEYS = {
  BOOKS: 'aes_books_v1',
  BOOK_CONTENT: (id) => `aes_book_${id}_content_v1`,
  AI_TEMP: (id) => `aes_book_${id}_ai_temp_v1`,
  AI_LIBRARY: 'aes_ai_library_v1',
  UI_PREF: 'aes_ui_pref_v1'
};

export const AI_DEFAULTS = {
  provider: 'chatgpt', // chatgpt | gemini | claude
  providers: [
    { key: 'chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com/' },
    { key: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/' },
    { key: 'claude', name: 'Claude', url: 'https://claude.ai/' }
  ],
  state: 'stability',
  lens: 'philosophy'
};

export const AI_STATES = [
  { key: 'stability', label: '自我穩定', hint: '站得住，不被拉走' },
  { key: 'ease', label: '自在感', hint: '鬆一口氣，不勉強' },
  { key: 'potential', label: '潛能流動', hint: '鬆開卡點，自然流動' },
  { key: 'agency', label: '我能感', hint: '下一小步可行' }
];

export const AI_LENSES = [
  { key: 'philosophy', label: '哲思', hint: '換位置看，不急著給答案' },
  { key: 'micro_science', label: '微科學', hint: '說清發生了什麼，不炫名詞' },
  { key: 'parenting', label: '教養／關係', hint: '用情境呈現，不評對錯' },
  { key: 'venting', label: '舒發', hint: '把感覺說出來，不分析' }
];
