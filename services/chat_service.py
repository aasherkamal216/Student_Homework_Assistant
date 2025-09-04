import os
from typing import List, Dict, Any, Optional, AsyncGenerator
from litellm import acompletion

from models.chat import ChatRequest, ChatResponse, StreamResponse
from prompts import SYSTEM_PROMPT

class ChatService:
    def __init__(self):
        self.model = f"gemini/{os.getenv('MODEL', 'gemini-2.5-flash')}"
        self.api_key = os.getenv("GOOGLE_API_KEY")
        
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is required")

    async def process_chat(self, request: ChatRequest) -> ChatResponse:
        """Process a complete chat request and return the response"""
        try:
            # Prepare messages with system prompt
            messages = self._prepare_messages(request)
            
            # Prepare tools based on command
            tools = self._prepare_tools(request.command)
            
            # Make the API call
            response = await acompletion(
                model=self.model,
                messages=messages,
                temperature=request.settings.temperature,
                top_p=request.settings.top_p,
                reasoning_effort=request.settings.reasoning_effort,
                api_key=self.api_key,
                tools=tools,
                stream=False
            )
            
            content = response.choices[0].message.content or ""
            reasoning_content = getattr(response.choices[0].message, "reasoning_content", None)
            
            return ChatResponse(
                content=content,
                reasoning_content=reasoning_content
            )
            
        except Exception as e:
            return ChatResponse(
                content="",
                error=str(e)
            )

    async def stream_chat(self, request: ChatRequest) -> AsyncGenerator[StreamResponse, None]:
        """Stream chat response"""
        try:
            # Prepare messages with system prompt
            messages = self._prepare_messages(request)
            
            # Prepare tools based on command
            tools = self._prepare_tools(request.command)
            
            # Make the streaming API call
            response = await acompletion(
                model=self.model,
                messages=messages,
                temperature=request.settings.temperature,
                top_p=request.settings.top_p,
                reasoning_effort=request.settings.reasoning_effort,
                api_key=self.api_key,
                tools=tools,
                stream=True
            )
            
            async for part in response:
                chunk_response = StreamResponse()
                
                if hasattr(part.choices[0].delta, "reasoning_content"):
                    reasoning = part.choices[0].delta.reasoning_content or ""
                    if reasoning:
                        chunk_response.reasoning_content = reasoning
                
                content = part.choices[0].delta.content or ""
                if content:
                    chunk_response.content = content
                
                if chunk_response.content or chunk_response.reasoning_content:
                    yield chunk_response
                    
        except Exception as e:
            yield StreamResponse(error=str(e), finished=True)

    def _prepare_messages(self, request: ChatRequest) -> List[Dict[str, Any]]:
        """Prepare messages with system prompt"""
        messages = []
        
        # Add system message first
        messages.append({
            "role": "system", 
            "content": SYSTEM_PROMPT
        })
        
        # Add all messages from the request
        for message in request.messages:
            if message.role == "system":
                continue  # Skip additional system messages since we already added one
                
            # Convert message to dict format expected by litellm
            if isinstance(message.content, str):
                # Simple text message
                messages.append({
                    "role": message.role,
                    "content": message.content
                })
            else:
                # Complex content with text and/or images
                content_parts = []
                for part in message.content:
                    if hasattr(part, 'dict'):
                        content_parts.append(part.dict())
                    elif isinstance(part, dict):
                        content_parts.append(part)
                
                messages.append({
                    "role": message.role,
                    "content": content_parts
                })
        
        return messages

    def _prepare_tools(self, command: str) -> List[Dict[str, Any]]:
        """Prepare tools based on the command"""
        tools = []
        
        if command == "search":
            tools = [{"googleSearch": {}}]
        elif command == "url_context":
            tools = [{"urlContext": {}}]
            
        return tools