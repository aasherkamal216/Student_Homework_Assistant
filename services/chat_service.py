import os
from typing import List, Dict, Any, Optional, AsyncGenerator
from litellm import acompletion

from models.chat import ChatRequest, StreamResponse
from prompts import SYSTEM_PROMPT

class ChatService:
    def __init__(self):
        self.model = f"gemini/{os.getenv('MODEL', 'gemini-2.5-flash')}"
        self.api_key = os.getenv("GOOGLE_API_KEY")
        
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is required")

    async def stream_chat(self, request: ChatRequest) -> AsyncGenerator[StreamResponse, None]:
        """Stream chat response"""
        try:
            # Pass the entire request to format the system prompt
            messages = self._prepare_messages(request)
            tools = self._prepare_tools(request.command)
            
            completion_params = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.7,
                "top_p": 1.0,
                "api_key": self.api_key,
                "stream": True
            }
            if tools:
                completion_params["tools"] = tools

            response = await acompletion(**completion_params)
            
            async for part in response:
                content = part.choices[0].delta.content or ""
                if content:
                    yield StreamResponse(content=content)
                    
        except Exception as e:
            yield StreamResponse(error=str(e), finished=True)

    def _prepare_messages(self, request: ChatRequest) -> List[Dict[str, Any]]:
        """Prepare messages with a dynamically formatted system prompt"""
        
        # Format the system prompt with settings from the request
        formatted_system_prompt = SYSTEM_PROMPT.format(
            language=request.prompt_settings.language,
            subject=request.prompt_settings.subject,
            words_limit=request.prompt_settings.words_limit
        )
        
        messages = [{"role": "system", "content": formatted_system_prompt}]
        
        for message in request.messages:
            if message.role == "system":
                continue
            
            if isinstance(message.content, str):
                messages.append({"role": message.role, "content": message.content})
            else:
                content_parts = [part.model_dump() for part in message.content]
                messages.append({"role": message.role, "content": content_parts})
        
        return messages

    def _prepare_tools(self, command: Optional[str]) -> Optional[List[Dict[str, Any]]]:
        """Prepare tools based on the command"""
        if command == "search":
            # This specific format enables Gemini's native search via litellm
            return [{"googleSearch": {}}]
        return None # Return None when no tools are used