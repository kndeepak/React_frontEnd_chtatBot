import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
from typing import AsyncGenerator
from fastapi.responses import StreamingResponse

# Load environment variables
load_dotenv()

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Request model
class ChatRequest(BaseModel):
    message: str

def stream_response(request: ChatRequest) -> AsyncGenerator[str, None]:
    try:
        stream = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": request.message},
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.5,
            max_completion_tokens=1024,
            top_p=1,
            stop=None,
            stream=True,
        )
        for chunk in stream:
            content = chunk.choices[0].delta.content
            if content is None:
                content = ""
            yield content
    except Exception as e:
        yield f"Error: {str(e)}"

@app.post("/chat/")
def chat(request: ChatRequest):
    return StreamingResponse(stream_response(request), media_type="text/plain")

@app.get("/")
def root():
    return {"message": "FastAPI Groq API is running!"}
