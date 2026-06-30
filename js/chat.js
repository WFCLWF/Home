// ===== DeepSeek 聊天面板 =====
const deepseekSection = document.getElementById('deepseek-section');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const chatStatus = document.getElementById('chat-status');
const chatEmpty = chatMessages.querySelector('.chat-empty');

const API_URL = 'http://127.0.0.1:8054/api/chat';
let isSending = false;
let chatHistory = []; // 用于上下文记忆

// 格式化消息内容：解析 Markdown 代码块和行内代码
function formatContent(text) {
  if (!text) return '';

  // 统一换行符（SSE 流中可能混入 \r，导致 <pre> 中无法换行）
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const escapeHTML = (s) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const buildCodeBlock = (code, lang) => {
    const langLabel = lang || 'code';
    return `<div class="code-block-wrapper">
      <div class="code-toolbar">
        <span class="code-lang">${escapeHTML(langLabel)}</span>
        <button class="copy-btn">复制</button>
      </div>
      <pre><code>${escapeHTML(code)}</code></pre>
    </div>`;
  };

  // 简单按 ``` 分割 → 偶数索引=普通文本，奇数索引=代码块内容
  const parts = text.split(/```/);
  let result = '';

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // 普通文本
      result += processInline(parts[i]);
    } else {
      // 代码块：提取首行语言标识符
      let code = parts[i];
      let lang = '';

      // 情况1: 语言标签独占一行（```后换行）
      const nl = code.indexOf('\n');
      if (nl > 0) {
        const firstLine = code.substring(0, nl).trim();
        if (firstLine && /^[a-zA-Z][\w.#+\-]*$/.test(firstLine) && firstLine.length < 16) {
          lang = firstLine;
          code = code.substring(nl + 1);
        }
      } else if (nl === -1) {
        // 情况2: 语言标签与代码同行（"python import turtle"）
        const m = code.match(/^([a-zA-Z][\w.#+\-]{0,15})\s+(.+)/s);
        if (m) {
          lang = m[1];
          code = m[2];
        }
      }
      // nl === 0: ```后紧跟换行，无语言标签，不做处理

      result += buildCodeBlock(code.trimEnd(), lang);
    }
  }

  return result;

  // 处理行内代码：按 ` 分割 → 奇数索引为行内代码
  function processInline(s) {
    if (!s) return '';
    const segs = s.split(/`([^`]*)`/);
    let out = '';
    for (let j = 0; j < segs.length; j++) {
      if (j % 2 === 0) {
        out += escapeHTML(segs[j]).replace(/\n/g, '<br>');
      } else {
        out += `<code class="inline-code">${escapeHTML(segs[j])}</code>`;
      }
    }
    return out;
  }
}

// 添加消息到界面
function addMessage(role, text) {
  if (chatEmpty) chatEmpty.remove();

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'user' ? '👤' : '💠';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = formatContent(text);

  msgDiv.appendChild(avatar);
  msgDiv.appendChild(bubble);
  chatMessages.appendChild(msgDiv);

  // 自动滚动到底部
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return msgDiv;
}

// 显示打字动画
function showTyping() {
  if (chatEmpty) chatEmpty.remove();

  const msgDiv = document.createElement('div');
  msgDiv.className = 'chat-msg ai';
  msgDiv.id = 'typing-indicator';

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = '💠';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';

  msgDiv.appendChild(avatar);
  msgDiv.appendChild(bubble);
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

// 发送消息（流式 SSE）
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || isSending) return;

  isSending = true;
  chatInput.value = '';
  chatSendBtn.disabled = true;
  chatStatus.textContent = '发送中...';

  addMessage('user', text);
  showTyping();

  try {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_input: text })
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    // 流式读取 SSE
    removeTyping();
    const aiMsg = addMessage('ai', '');
    const bubble = aiMsg.querySelector('.msg-bubble');

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const chunk = line.slice(6);
          fullText += chunk;
          bubble.innerHTML = formatContent(fullText);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }
    }

    // 最终渲染，确保代码块完整
    bubble.innerHTML = formatContent(fullText);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    chatStatus.textContent = '就绪';
  } catch (err) {
    removeTyping();
    addMessage('ai', `❌ 请求失败: ${err.message}\n请确保本地服务已启动 (127.0.0.1:8000)`);
    chatStatus.textContent = '连接失败';
  } finally {
    isSending = false;
    chatSendBtn.disabled = false;
    chatInput.focus();
  }
}

// 聚焦 AI 输入框时显示右侧聊天面板
chatInput.addEventListener('focus', () => {
  deepseekSection.classList.add('visible');
});

// 发送按钮
chatSendBtn.addEventListener('click', sendMessage);

// Enter 发送
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// 代码块复制按钮（事件委托）
chatMessages.addEventListener('click', async (e) => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;

  const wrapper = btn.closest('.code-block-wrapper');
  const code = wrapper.querySelector('code').textContent;

  try {
    await navigator.clipboard.writeText(code);
    btn.textContent = '已复制 ✓';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '复制';
      btn.classList.remove('copied');
    }, 1500);
  } catch {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = code;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    btn.textContent = '已复制 ✓';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '复制';
      btn.classList.remove('copied');
    }, 1500);
  }
});
