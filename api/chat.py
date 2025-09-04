from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
import json
from typing import AsyncGenerator

from models.chat import ChatRequest, ChatResponse, StreamResponse
from services.chat_service import ChatService

chat_router = APIRouter(prefix="/chat", tags=["chat"])

def get_chat_service():
    return ChatService()

@chat_router.post("/", response_model=ChatResponse)
async def chat_completion(
    request: ChatRequest,
    chat_service: ChatService = Depends(get_chat_service)
):
    """
    Process chat completion request
    """
    try:
        response = await chat_service.process_chat(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@chat_router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    chat_service: ChatService = Depends(get_chat_service)
):
    """
    Stream chat completion response
    """
    try:
        async def generate_stream() -> AsyncGenerator[str, None]:
            async for chunk in chat_service.stream_chat(request):
                yield f"data: {json.dumps(chunk.model_dump())}\n\n"
            
            # Send final message
            final_chunk = StreamResponse(finished=True)
            yield f"data: {json.dumps(final_chunk.model_dump())}\n\n"

        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )
    except Exception as e:
        error_chunk = StreamResponse(error=str(e), finished=True)
        async def error_stream():
            yield f"data: {json.dumps(error_chunk.model_dump())}\n\n"
        
        return StreamingResponse(
            error_stream(),
            media_type="text/plain",
            status_code=500
        )