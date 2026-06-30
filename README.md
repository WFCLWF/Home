# Home

现代化浏览器首页，集成 **AI 助手**、多引擎搜索与自动建议。

## 功能

- 🔍 **多引擎搜索** — 支持 Google、Bing、百度、DuckDuckGo，默认 Google
- 💡 **搜索建议** — Google / Bing / DuckDuckGo 输入时自动补全（通过后端代理绕过 CORS）
- 💠 **AI 助手** — 右侧栏内嵌对话面板，支持 SSE 流式响应
- 🕐 **实时时钟** — 显示当前时间与日期
- 🎨 **深色主题** — 暗色背景 + 毛玻璃效果
- 📱 **响应式设计** — 宽屏侧栏布局，窄屏自动切换为上下布局
- ⌨️ **键盘快捷键** — Ctrl+↑↓ 切换搜索框/AI输入框，Ctrl+←→ 切换搜索引擎
- 💾 **本地存储** — 搜索引擎选择自动保存

## 快捷键

| 快捷键 | 操作 |
|--------|------|
| `Ctrl + ↑` | 聚焦搜索框（有内容时重新打开建议） |
| `Ctrl + ↓` | 关闭建议 → 聚焦 AI 输入框 |
| `Ctrl + ←` | 上一个搜索引擎 |
| `Ctrl + →` | 下一个搜索引擎 |
| `Enter` | 搜索框：执行搜索 / AI输入框：发送消息 |
| `↑↓` | 搜索建议项之间移动 |
| `Esc` | 关闭搜索建议 |

## 项目结构

```
Home/
├── index.html          # 前端入口（纯 HTML 结构）
├── css/
│   └── style.css       # 全局样式
├── js/
│   ├── clock.js        # 实时时钟
│   ├── search.js       # 搜索引擎、建议、快捷键
│   └── chat.js         # AI 聊天面板（消息渲染、SSE）
├── static/
│   └── 图标.png        # 网站图标
├── chat_api.py         # FastAPI 后端入口
├── llm_chat.py         # DeepSeek 对话封装
├── requirements.txt    # Python 依赖
├── setup_autostart.bat # 开机自启配置脚本
├── start_chat_api.vbs  # 无窗口后台启动
└── stop_chat_api.bat   # 停止后台服务
```

## 快速开始

### 1. 前端

直接用浏览器打开 `index.html` 即可使用搜索和时钟功能。

若想设为浏览器主页，将 `index.html` 的完整路径填入浏览器启动页设置即可。

> **注意**：搜索建议和 AI 对话需要后端服务运行。

### 2. 后端（搜索建议 + AI 对话）

```bash
# 安装依赖
pip install -r requirements.txt

# 启动服务
python chat_api.py
```

服务运行在 `http://127.0.0.1:8054`。

### 3. 配置 API Key

在 [llm_chat.py](llm_chat.py) 中修改 `api_key`、`base_url` 和 `model`。

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat` | 发送消息，返回 SSE 流式响应 |
| GET | `/api/suggest` | 搜索建议代理（绕过 CORS） |

### POST /api/chat

**请求体：**

```json
{ "user_input": "你好" }
```

**响应：** `text/event-stream`，逐块返回 AI 回复：

```
data: 你好
data: ！有
data: 什么可以帮你的？
```

### GET /api/suggest

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `q` | string | 搜索关键词 |
| `engine` | string | 搜索引擎（google / bing / duckduckgo） |

**示例：**

```
GET /api/suggest?engine=google&q=hello
```

## 技术栈

- **前端** — 原生 HTML / CSS / JavaScript，无框架依赖
- **后端** — Python FastAPI + httpx（代理）+ OpenAI SDK（兼容 DeepSeek API）
- **AI 模型** — DeepSeek V4 Flash（可替换为任意 OpenAI 兼容接口）
