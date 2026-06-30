// ===== 搜索引擎配置 =====
const engines = {
  google: {
    name: 'Google',
    searchUrl: 'https://www.google.com/search?q=',
    suggestUrl: 'https://suggestqueries.google.com/complete/search?client=chrome&q='
  },
  bing: {
    name: 'Bing',
    searchUrl: 'https://www.bing.com/search?q=',
    suggestUrl: 'https://api.bing.com/osjson.aspx?query='
  },
  baidu: {
    name: '百度',
    searchUrl: 'https://www.baidu.com/s?wd=',
    suggestUrl: 'https://suggestion.baidu.com/su?wd='
  },
  duckduckgo: {
    name: 'DuckDuckGo',
    searchUrl: 'https://duckduckgo.com/?q=',
    suggestUrl: 'https://duckduckgo.com/ac/?q='
  }
};

let currentEngine = localStorage.getItem('homepage-search-engine') || 'google';

// ===== DOM 元素 =====
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const clearBtn = document.getElementById('clear-btn');
const suggestionsEl = document.getElementById('suggestions');
const engineTabs = document.querySelectorAll('.engine-tab');

// ===== 初始化搜索引擎 =====
function setEngine(engine) {
  currentEngine = engine;
  localStorage.setItem('homepage-search-engine', engine);
  searchInput.placeholder = `在 ${engines[engine].name} 上搜索`;

  engineTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.engine === engine);
  });
}

engineTabs.forEach(tab => {
  tab.addEventListener('click', () => setEngine(tab.dataset.engine));
});

setEngine(currentEngine);

// ===== 执行搜索 =====
function doSearch(query) {
  const q = query || searchInput.value.trim();
  if (!q) return;
  const url = engines[currentEngine].searchUrl + encodeURIComponent(q);
  window.location.href = url;
}

searchBtn.addEventListener('click', () => doSearch());
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    // 如果有选中的建议项，使用建议项文本
    const active = suggestionsEl.querySelector('.suggestion-item.active');
    if (active) {
      doSearch(active.querySelector('.sug-text').textContent);
    } else {
      doSearch();
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    moveSuggestion(1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    moveSuggestion(-1);
  } else if (e.key === 'Escape') {
    suggestionsEl.classList.remove('show');
  }
});

// ===== 清除按钮 =====
searchInput.addEventListener('input', () => {
  const hasText = searchInput.value.trim().length > 0;
  clearBtn.classList.toggle('visible', hasText);
  if (hasText) {
    fetchSuggestions(searchInput.value.trim());
  } else {
    suggestionsEl.classList.remove('show');
  }
});

clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  clearBtn.classList.remove('visible');
  suggestionsEl.classList.remove('show');
  searchInput.focus();
});

// ===== 搜索建议 =====
let suggestionIndex = -1;
let suggestionTimer = null;

function moveSuggestion(direction) {
  const items = suggestionsEl.querySelectorAll('.suggestion-item');
  if (items.length === 0) return;

  items.forEach(item => item.classList.remove('active'));

  suggestionIndex += direction;
  if (suggestionIndex < 0) suggestionIndex = items.length - 1;
  if (suggestionIndex >= items.length) suggestionIndex = 0;

  const active = items[suggestionIndex];
  active.classList.add('active');
  searchInput.value = active.querySelector('.sug-text').textContent;
}

async function fetchSuggestions(query) {
  const engine = engines[currentEngine];
  if (!engine.suggestUrl || query.length < 1) {
    suggestionsEl.classList.remove('show');
    return;
  }

  clearTimeout(suggestionTimer);
  suggestionTimer = setTimeout(async () => {
    try {
      let suggestions = [];

      // 通过本地后端代理请求，绕过浏览器 CORS
      const proxyUrl = `http://127.0.0.1:8054/api/suggest?engine=${currentEngine}&q=${encodeURIComponent(query)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();

      if (currentEngine === 'google' || currentEngine === 'bing') {
        suggestions = (data[1] || []).slice(0, 8);
      } else if (currentEngine === 'duckduckgo') {
        suggestions = (data || []).map(item => item.phrase).slice(0, 8);
      }

      if (suggestions.length > 0) {
        suggestionIndex = -1;
        suggestionsEl.innerHTML = suggestions.map((s, i) => `
          <div class="suggestion-item" data-index="${i}">
            <svg class="sug-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span class="sug-text">${escapeHtml(s)}</span>
          </div>
        `).join('');
        suggestionsEl.classList.add('show');

        // 点击建议项
        suggestionsEl.querySelectorAll('.suggestion-item').forEach(item => {
          item.addEventListener('click', () => {
            doSearch(item.querySelector('.sug-text').textContent);
          });
        });
      } else {
        suggestionsEl.classList.remove('show');
      }
    } catch (e) {
      // 静默失败
      suggestionsEl.classList.remove('show');
    }
  }, 200);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 点击外部关闭建议
document.addEventListener('click', (e) => {
  if (!suggestionsEl.contains(e.target) && e.target !== searchInput) {
    suggestionsEl.classList.remove('show');
  }
});

// ===== 全局快捷键 =====
// Ctrl+↑ → 聚焦搜索框 / Ctrl+↓ → 聚焦AI输入框
// Ctrl+← → 上一个搜索引擎 / Ctrl+→ → 下一个搜索引擎
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'ArrowUp') {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
    // 如果有输入内容则重新打开建议
    const q = searchInput.value.trim();
    if (q) fetchSuggestions(q);
  } else if (e.ctrlKey && e.key === 'ArrowDown') {
    e.preventDefault();
    // 先关闭建议下拉，避免遮挡 AI 输入框
    suggestionsEl.classList.remove('show');
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.focus();
      chatInput.select();
    }
  } else if (e.ctrlKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    const keys = Object.keys(engines);
    const idx = keys.indexOf(currentEngine);
    const delta = e.key === 'ArrowLeft' ? -1 : 1;
    const newIdx = (idx + delta + keys.length) % keys.length;
    setEngine(keys[newIdx]);
  }
});
