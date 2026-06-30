from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse, JSONResponse
import uvicorn
import pydantic
import httpx
from fastapi.middleware.cors import CORSMiddleware
from llm_chat import LLMChat


# 请求体
class chat_request(pydantic.BaseModel):
    user_input: str


# 响应体
class chat_response(pydantic.BaseModel):
    code: int
    message: str
    data: dict


app = FastAPI()
llmchat = LLMChat()

# 跨域配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 搜索引擎建议 API 配置
SUGGEST_URLS = {
    "google": "https://suggestqueries.google.com/complete/search?client=chrome&q={query}",
    "bing": "https://api.bing.com/osjson.aspx?query={query}",
    "duckduckgo": "https://duckduckgo.com/ac/?q={query}",
}

# 搜索建议代理（绕过浏览器 CORS）
@app.get("/api/suggest")
async def suggest(q: str = Query(..., min_length=1), engine: str = Query(default="google")):
    url_template = SUGGEST_URLS.get(engine)
    if not url_template:
        return JSONResponse({"error": "unsupported engine"}, status_code=400)
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url_template.format(query=q))
            data = resp.json()
            return JSONResponse(data)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=502)


# 对话接口（流式SSE）
@app.post("/api/chat")
async def chat(chat_data: chat_request):
    def generate():
        for chunk in llmchat.chat_stream(chat_data.user_input):
            # 统一换行为 \r，避免 \n 被 SSE 协议当作行分隔符截断
            safe = chunk.replace('\r\n', '\r').replace('\n', '\r')
            yield f"data: {safe}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


if __name__ == "__main__":
    uvicorn.run("chat_api:app", host="127.0.0.1", port=8054, reload=True)
