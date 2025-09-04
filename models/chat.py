from pydantic import BaseModel, Field
from typing import List, Dict, Literal, Optional, Union

class MessageContent(BaseModel):
    type: str = Field(..., description="Content type: 'text' or 'image_url'")
    text: Optional[str] = Field(None, description="Text content")
    image_url: Optional[Dict[str, str]] = Field(None, description="Image URL object with 'url' key")

class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the message sender (system, user, assistant)")
    content: Union[str, List[MessageContent]] = Field(..., description="Message content - string for simple text or list for mixed content")

# New model to receive language and subject
class PromptSettings(BaseModel):
    language: str = "English"
    subject: str = "General"
    words_limit: int = 100

class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., description="List of messages in the conversation")
    # This field will now carry the prompt settings from the frontend
    prompt_settings: PromptSettings = Field(default_factory=PromptSettings)
    command: Optional[Literal["search"]] = None

class ChatResponse(BaseModel):
    content: str
    error: Optional[str] = None

class StreamResponse(BaseModel):
    content: Optional[str] = None
    finished: bool = False
    error: Optional[str] = None