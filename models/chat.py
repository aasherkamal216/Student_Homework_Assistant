from pydantic import BaseModel, Field
from typing import List, Dict, Literal, Optional, Union

class MessageContent(BaseModel):
    type: str = Field(..., description="Content type: 'text' or 'image_url'")
    text: Optional[str] = Field(None, description="Text content")
    image_url: Optional[Dict[str, str]] = Field(None, description="Image URL object with 'url' key")

class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the message sender (system, user, assistant)")
    content: Union[str, List[MessageContent]] = Field(..., description="Message content - string for simple text or list for mixed content")

class ChatSettings(BaseModel):
    temperature: float = Field(1.0, ge=0.0, le=2.0)
    top_p: float = Field(0.8, ge=0.0, le=1.0)
    reasoning_effort: Literal["low", "medium", "high"] = "low"

class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., description="List of messages in the conversation")
    settings: Optional[ChatSettings] = Field(default_factory=ChatSettings)
    command: Optional[Literal["search", "url_context"]] = None

class ChatResponse(BaseModel):
    content: str
    reasoning_content: Optional[str] = None
    error: Optional[str] = None

class StreamResponse(BaseModel):
    content: Optional[str] = None
    reasoning_content: Optional[str] = None
    finished: bool = False
    error: Optional[str] = None