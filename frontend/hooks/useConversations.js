import { useState, useEffect } from 'react';

const STORAGE_KEY = 'sidekick_conversations';

export function useConversations() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);

  // Load conversations from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConversations(parsed.conversations || []);
        setCurrentConversationId(parsed.currentId || null);
        
        // If we have conversations but no current one, select the most recent
        if (parsed.conversations && parsed.conversations.length > 0 && !parsed.currentId) {
          const mostRecent = parsed.conversations.reduce((latest, conv) => 
            conv.lastUpdated > latest.lastUpdated ? conv : latest
          );
          setCurrentConversationId(mostRecent.id);
        }
      } else {
        // Create initial conversation if none exist
        createNewConversation();
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      createNewConversation();
    }
  }, []);

  // Save to localStorage whenever conversations or currentId changes
  useEffect(() => {
    if (conversations.length > 0 || currentConversationId) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          conversations,
          currentId: currentConversationId
        }));
      } catch (error) {
        console.error('Error saving conversations:', error);
      }
    }
  }, [conversations, currentConversationId]);

  const createNewConversation = () => {
    const newId = Date.now().toString();
    const newConversation = {
      id: newId,
      name: `Interview ${new Date().toLocaleDateString()}`,
      history: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    setConversations(prev => [newConversation, ...prev].sort((a, b) => 
      new Date(b.lastUpdated) - new Date(a.lastUpdated)
    ));
    setCurrentConversationId(newId);
    return newId;
  };

  const selectConversation = (id) => {
    const exists = conversations.find(conv => conv.id === id);
    if (exists) {
      setCurrentConversationId(id);
    }
  };

  const deleteConversation = (id) => {
    setConversations(prev => {
      const filtered = prev.filter(conv => conv.id !== id);
      
      // If we deleted the current conversation, switch to another one or create new
      if (id === currentConversationId) {
        if (filtered.length > 0) {
          const newCurrent = filtered[0];
          setCurrentConversationId(newCurrent.id);
        } else {
          // No conversations left, create a new one
          setTimeout(() => createNewConversation(), 0);
          setCurrentConversationId(null);
        }
      }
      
      return filtered;
    });
  };

  const renameConversation = (id, newName) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === id 
          ? { ...conv, name: newName, lastUpdated: new Date().toISOString() }
          : conv
      ).sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
    );
  };

  const addToCurrentConversation = (prompt, response, sources = []) => {
    if (!currentConversationId) {
      const newId = createNewConversation();
      // The conversation will be added in the next effect cycle
      setTimeout(() => addToCurrentConversation(prompt, response, sources), 0);
      return;
    }

    const newEntry = {
      id: Date.now().toString(),
      prompt,
      response,
      sources,
      timestamp: new Date().toISOString()
    };

    setConversations(prev =>
      prev.map(conv =>
        conv.id === currentConversationId
          ? {
              ...conv,
              history: [...conv.history, newEntry],
              lastUpdated: new Date().toISOString(),
              // Auto-rename if this is the first message and still has default name
              name: conv.history.length === 0 && conv.name.startsWith('Interview')
                ? `${prompt.slice(0, 30)}${prompt.length > 30 ? '...' : ''}`
                : conv.name
            }
          : conv
      ).sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
    );
  };

  const getCurrentConversation = () => {
    return conversations.find(conv => conv.id === currentConversationId) || null;
  };

  const getCurrentHistory = () => {
    const current = getCurrentConversation();
    return current ? current.history : [];
  };

  return {
    conversations,
    currentConversationId,
    createNewConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    addToCurrentConversation,
    getCurrentConversation,
    getCurrentHistory
  };
}