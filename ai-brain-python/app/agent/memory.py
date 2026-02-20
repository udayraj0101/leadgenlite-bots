from typing import Dict, List
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage


class ConversationMemory:
    """In-memory conversation storage"""
    
    def __init__(self):
        self._storage: Dict[str, List[BaseMessage]] = {}
    
    def get_history(self, user_id: str) -> List[BaseMessage]:
        """Retrieve conversation history for a user"""
        return self._storage.get(user_id, [])
    
    def save_history(self, user_id: str, messages: List[BaseMessage]):
        """Save conversation history for a user"""
        self._storage[user_id] = messages
    
    def clear_history(self, user_id: str):
        """Clear conversation history for a user"""
        if user_id in self._storage:
            del self._storage[user_id]


# Singleton instance
memory = ConversationMemory()
