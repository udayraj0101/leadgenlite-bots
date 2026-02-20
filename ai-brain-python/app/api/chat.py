from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from langchain_core.messages import HumanMessage, AIMessage
from app.agent.graph import graph
from app.agent.analyzer import analyze_conversation


router = APIRouter()


class MessageHistory(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str


class ChatRequest(BaseModel):
    user_id: str
    platform: str
    message: str
    history: List[MessageHistory] = Field(default_factory=list)
    platform_data: Dict = Field(default_factory=dict)
    known_entities: Dict = Field(default_factory=dict)


class Metadata(BaseModel):
    new_entities: Dict[str, Optional[str]] = Field(default_factory=dict)
    intent: str = ""
    sentiment: str = ""
    confidence: float = 0.0
    lead_score: int = 0
    urgency: str = "medium"
    suggested_action: str = ""
    should_notify_sales: bool = False


class ChatResponse(BaseModel):
    user_id: str
    platform: str
    response: str
    success: bool
    metadata: Metadata


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Handle chat requests with conversation history and AI analysis"""
    try:
        # Convert history to LangChain messages
        messages = []
        for msg in request.history:
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            else:
                messages.append(AIMessage(content=msg.content))
        
        # Add current user message
        messages.append(HumanMessage(content=request.message))
        
        # Prepare state
        state = {
            "messages": messages,
            "user_id": request.user_id,
            "platform": request.platform
        }
        
        # Run agent
        result = graph.invoke(state)
        
        # Extract response
        last_message = result["messages"][-1]
        response_text = last_message.content
        
        # Analyze conversation for metadata
        metadata = analyze_conversation(
            messages=result["messages"],
            known_entities=request.known_entities
        )
        
        return ChatResponse(
            user_id=request.user_id,
            platform=request.platform,
            response=response_text,
            success=True,
            metadata=metadata
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Handle chat requests with conversation history"""
    try:
        # Load conversation history
        history = memory.get_history(request.user_id)
        
        # Create new user message
        user_message = HumanMessage(content=request.message)
        
        # Prepare state
        state = {
            "messages": history + [user_message],
            "user_id": request.user_id,
            "platform": request.platform
        }
        
        # Run agent
        result = graph.invoke(state)
        
        # Save updated history
        memory.save_history(request.user_id, result["messages"])
        
        # Extract response
        last_message = result["messages"][-1]
        response_text = last_message.content
        
        return ChatResponse(
            user_id=request.user_id,
            platform=request.platform,
            response=response_text,
            success=True
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
