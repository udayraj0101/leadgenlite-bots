from typing import List, Dict, Optional
from langchain_core.messages import BaseMessage, SystemMessage
from langchain_openai import ChatOpenAI
import json


def analyze_conversation_with_ai(messages: List[BaseMessage], known_entities: Dict) -> Dict:
    """Complete AI-powered conversation analysis using GPT-4o-mini"""
    
    # Extract only user messages
    user_messages = [
        msg.content for msg in messages 
        if msg.__class__.__name__ == "HumanMessage" and hasattr(msg, 'content')
    ]
    
    if not user_messages:
        return {
            "new_entities": {},
            "intent": "general_inquiry",
            "sentiment": "neutral",
            "confidence": 0.5,
            "lead_score": 0,
            "urgency": "low",
            "suggested_action": "continue_conversation",
            "should_notify_sales": False
        }
    
    conversation = "\n".join([f"User: {msg}" for msg in user_messages])
    
    analysis_prompt = f"""You are an expert lead qualification analyst for LeadgenLite, a lead generation platform.

Analyze the following user conversation and provide a comprehensive analysis.

**Already Known Information:**
{json.dumps(known_entities, indent=2)}

**User Conversation:**
{conversation}

**Your Task:**
Provide a detailed JSON analysis with the following structure:

{{
  "new_entities": {{
    // Extract ONLY information the user explicitly mentioned about THEMSELVES
    // Do NOT include: product names, features, or information from responses
    // Only include fields where user provided NEW information not in "Already Known"
    "name": "user's full name (if mentioned)",
    "email": "user's email (if mentioned)",
    "phone": "user's phone with country code (if mentioned)",
    "company": "user's company name (if mentioned)",
    "job_title": "user's job title (if mentioned)",
    "plan_interest": "basic/pro/enterprise (if user expressed interest)",
    "budget": "user's budget or price range (if mentioned)",
    "team_size": "user's team size as number or range (if mentioned)",
    "use_case": "what user wants to use product for (if mentioned)"
  }},
  
  "intent": "primary intent - choose ONE:",
  // Options:
  // - "pricing_inquiry": asking about prices, costs, plans
  // - "demo_request": wants to see demo, trial, or schedule meeting
  // - "feature_inquiry": asking about features, capabilities
  // - "support": needs help with issues or problems
  // - "complaint": expressing dissatisfaction
  // - "general_inquiry": general questions, greetings
  
  "sentiment": "overall sentiment - choose ONE:",
  // Options: "positive", "neutral", "negative"
  // positive: enthusiastic, interested, grateful
  // neutral: informational, matter-of-fact
  // negative: frustrated, disappointed, angry
  
  "confidence": 0.0-1.0,
  // How confident are you in intent and sentiment analysis?
  // 0.9-1.0: Very clear intent and sentiment
  // 0.7-0.9: Clear but some ambiguity
  // 0.5-0.7: Moderate confidence
  // 0.0-0.5: Low confidence or unclear
  
  "lead_score": 0-100,
  // Score based on:
  // - Contact info completeness (name: +10, email: +15, phone: +10, company: +5)
  // - Intent quality (demo_request: +30, pricing_inquiry: +25, feature: +20, general: +10, support: +5)
  // - Sentiment (positive: +15, neutral: +10, negative: +0)
  // - Engagement (plan_interest: +10, budget: +5)
  // Calculate total (max 100)
  
  "urgency": "lead urgency - choose ONE:",
  // Options: "high", "medium", "low"
  // high: demo request, pricing inquiry with positive sentiment, or complaints
  // medium: has budget/plan interest
  // low: general inquiry, just browsing
  
  "suggested_action": "recommended next action - choose ONE:",
  // Options based on lead_score:
  // 70+: "schedule_demo", "send_pricing_proposal", "sales_follow_up"
  // 50-69: "send_pricing_info", "send_feature_guide", "nurture_lead"
  // <50: "continue_conversation"
  
  "should_notify_sales": true/false,
  // true if: lead_score >= 70 (qualified lead)
  // false otherwise
  
  "reasoning": "brief explanation of your analysis (1-2 sentences)"
}}

**Critical Rules:**
1. Extract ONLY what the USER said about THEMSELVES
2. Do NOT extract product information, features, or pricing details
3. Only include fields in new_entities if user explicitly mentioned them
4. If user hasn't mentioned something, omit that field from new_entities
5. Be precise with intent - choose the PRIMARY intent
6. Calculate lead_score accurately using the formula provided

Return ONLY valid JSON, no markdown, no explanations outside the JSON.
"""
    
    try:
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        result = llm.invoke([SystemMessage(content=analysis_prompt)])
        
        # Parse JSON response
        content = result.content.strip()
        
        # Remove markdown code blocks if present
        if content.startswith("```"):
            lines = content.split("\n")
            content = "\n".join(lines[1:-1]) if len(lines) > 2 else content
            if content.startswith("json"):
                content = content[4:].strip()
        
        analysis = json.loads(content)
        
        # Remove reasoning field (internal only)
        if "reasoning" in analysis:
            del analysis["reasoning"]
        
        # Convert all entity values to strings
        new_entities = analysis.get("new_entities", {})
        for key, value in new_entities.items():
            if value is not None:
                new_entities[key] = str(value)
        
        # Ensure all required fields exist
        return {
            "new_entities": new_entities,
            "intent": analysis.get("intent", "general_inquiry"),
            "sentiment": analysis.get("sentiment", "neutral"),
            "confidence": round(float(analysis.get("confidence", 0.5)), 2),
            "lead_score": int(analysis.get("lead_score", 0)),
            "urgency": analysis.get("urgency", "low"),
            "suggested_action": analysis.get("suggested_action", "continue_conversation"),
            "should_notify_sales": bool(analysis.get("should_notify_sales", False))
        }
        
    except Exception as e:
        print(f"AI analysis error: {e}")
        # Fallback to basic analysis
        return {
            "new_entities": {},
            "intent": "general_inquiry",
            "sentiment": "neutral",
            "confidence": 0.3,
            "lead_score": 10,
            "urgency": "low",
            "suggested_action": "continue_conversation",
            "should_notify_sales": False
        }


def analyze_conversation(messages: List[BaseMessage], known_entities: Dict) -> Dict:
    """Main entry point for conversation analysis"""
    return analyze_conversation_with_ai(messages, known_entities)
