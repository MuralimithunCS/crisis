from fastapi import APIRouter, HTTPException
from ..models.schemas import ChatRequest, ChatResponse
from ..agents.llm import LLMService

router = APIRouter()
llm_service = LLMService()

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    try:
        # LLM helper expects only the message string (context is ignored in MVP).
        response = await llm_service.chat_with_assistant(request.message or "")
        return ChatResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
