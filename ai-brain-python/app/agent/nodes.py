from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage
from .state import AgentState
from .tools_enhanced import TOOLS
import os


def load_system_prompt() -> str:
    """Load system prompt from external file"""
    prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", "system.txt")
    with open(prompt_path, "r") as f:
        return f.read()


def agent_node(state: AgentState) -> AgentState:
    """Agent node that processes messages and calls tools if needed"""
    model = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    model_with_tools = model.bind_tools(TOOLS)
    
    system_prompt = load_system_prompt()
    messages = [SystemMessage(content=system_prompt)] + state["messages"]
    
    response = model_with_tools.invoke(messages)
    return {"messages": [response]}


def should_continue(state: AgentState) -> str:
    """Determine if we should continue to tools or end"""
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return "end"
