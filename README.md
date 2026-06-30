# Home

现代化浏览器首页，集成 **AI 助手**、多引擎搜索与常用快捷方式。

## 功能

- 🔍 **多引擎搜索** — 支持 Google、Bing、百度、DuckDuckGo，默认 Google
- 💠 **AI 助手** — 右侧栏内嵌 DeepSeek 对话面板，支持流式响应
- 🕐 **实时时钟** — 显示当前时间与日期
- 💡 **搜索建议** — Google 和百度输入时自动补全
- 🔗 **快捷链接** — 预设 GitHub、Bilibili、Gmail 等常用网站，右键可编辑
- 🎨 **深色主题** — 暗色背景 + 毛玻璃效果
- 📱 **响应式设计** — 宽屏侧栏布局，窄屏自动切换为上下布局
- ⌨️ **键盘快捷键** — Ctrl+↑↓ 切换搜索框/AI输入框，Ctrl+←→ 切换搜索引擎
- 💾 **本地存储** — 搜索引擎选择、快捷方式、聊天记录自动保存

### 快捷键

| 快捷键 | 操作 |
|--------|------|
| `Ctrl + ↑` | 聚焦搜索框 |
| `Ctrl + ↓` | 聚焦 AI 输入框 |
| `Ctrl + ←` | 上一个搜索引擎 |
| `Ctrl + →` | 下一个搜索引擎 |
| `Enter` | 搜索框：执行搜索 / AI输入框：发送消息 |

## 项目结构

```
Home/
├── index.html          # 前端页面（搜索 + AI 聊天）
├── chat_api.py         # FastAPI 后端入口
├── llm_chat.py         # DeepSeek 对话封装
├── setup_autostart.bat # 开机自启配置脚本
├── start_chat_api.vbs  # 无窗口后台启动
├── stop_chat_api.bat   # 停止后台服务
└── .gitignore
```

## 快速开始

### 1. 前端

直接用浏览器打开 `index.html`，所有功能开箱即用。

若想设为浏览器主页，将 `index.html` 的完整路径填入浏览器启动页设置即可。

### 2. 后端（AI 对话）

AI 聊天功能需要本地运行后端服务：

```bash
# 安装依赖
pip install fastapi uvicorn openai pydantic

# 启动服务
python chat_api.py
```

服务默认运行在 `http://127.0.0.1:8000`，前端自动连接该地址。

### 3. 配置 API Key

在 [llm_chat.py](llm_chat.py) 中修改 `api_key`、`base_url` 和 `model` 为你自己的 API 配置。

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat` | 发送消息，返回 SSE 流式响应 |

**请求体：**

```json
{ "user_input": "你好" }
```

**响应：** `text/event-stream` 格式，逐块返回 AI 回复：

```
data: 你好
data: ！有
data: 什么可以帮你的？
```

## 技术栈

- **前端** — 原生 HTML / CSS / JavaScript，无框架依赖
- **后端** — Python FastAPI + OpenAI SDK（兼容 DeepSeek API）
- **AI 模型** — DeepSeek V4 Flash（可替换为任意 OpenAI 兼容接口）
