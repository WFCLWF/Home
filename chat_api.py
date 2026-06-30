from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import uvicorn
import pydantic
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
