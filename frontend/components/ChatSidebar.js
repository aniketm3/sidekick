import { useState, useEffect } from "react";

export default function ChatSidebar({ 
  conversations, 
  currentConversationId, 
  onSelectConversation, 
  onNewConversation, 
  onDeleteConversation,
  onRenameConversation,
  isOpen, 
  onToggle 
}) {
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const handleRename = (id, currentName) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const saveRename = () => {
    if (editingName.trim()) {
      onRenameConversation(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName("");
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingName("");
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
            display: window.innerWidth < 768 ? 'block' : 'none'
          }}
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div 
        style={{
          position: 'fixed',
          top: '98px', // Position below the header (approximate header height)
          left: 0,
          height: 'calc(100vh - 98px)',
          width: '280px',
          backgroundColor: '#fafafa',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #e5e5e5'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #e5e5e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ 
            color: '#333', 
            fontSize: '1.1rem', 
            fontWeight: '600',
            margin: 0,
            fontFamily: 'sans-serif'
          }}>
            Chat History
          </h2>
          <button
            onClick={onToggle}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: '0.25rem'
            }}
          >
            ×
          </button>
        </div>

        {/* New Chat Button */}
        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>
          <button
            onClick={onNewConversation}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              fontFamily: 'sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#4338ca'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#4f46e5'}
          >
            <span style={{ fontSize: '1.1rem' }}>+</span>
            New Interview
          </button>
        </div>

        {/* Conversations List */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          padding: '0.5rem'
        }}>
          {conversations.length === 0 ? (
            <div style={{
              color: '#666',
              fontSize: '0.9rem',
              textAlign: 'center',
              marginTop: '2rem',
              padding: '1rem',
              fontFamily: 'sans-serif'
            }}>
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <div key={conv.id} style={{ marginBottom: '0.25rem' }}>
                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: currentConversationId === conv.id ? '#f0f0f0' : 'transparent',
                    color: currentConversationId === conv.id ? '#333' : '#666',
                    border: currentConversationId === conv.id ? '1px solid #ddd' : '1px solid transparent',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'sans-serif'
                  }}
                  onClick={() => !editingId && onSelectConversation(conv.id)}
                  onMouseOver={(e) => {
                    if (currentConversationId !== conv.id) {
                      e.currentTarget.style.backgroundColor = '#f9f9f9';
                      e.currentTarget.style.border = '1px solid #e5e5e5';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (currentConversationId !== conv.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.border = '1px solid transparent';
                    }
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingId === conv.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename();
                          if (e.key === 'Escape') cancelRename();
                        }}
                        onBlur={saveRename}
                        autoFocus
                        style={{
                          background: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          padding: '0.25rem',
                          color: '#333',
                          fontSize: '0.85rem',
                          width: '100%',
                          outline: 'none',
                          fontFamily: 'sans-serif'
                        }}
                      />
                    ) : (
                      <>
                        <div style={{
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: currentConversationId === conv.id ? '#333' : '#333'
                        }}>
                          {conv.name}
                        </div>
                        <div style={{
                          fontSize: '0.7rem',
                          color: '#888',
                          marginTop: '0.2rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {conv.history.length} messages • {new Date(conv.lastUpdated).toLocaleDateString()}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {!editingId && (
                    <div style={{ 
                      display: 'flex', 
                      gap: '0.25rem',
                      opacity: currentConversationId === conv.id ? 1 : 0,
                      transition: 'opacity 0.2s'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(conv.id, conv.name);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#888',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          fontSize: '0.8rem',
                          borderRadius: '4px'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#e5e5e5'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                        title="Rename"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#888',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          fontSize: '0.8rem',
                          borderRadius: '4px'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#fee2e2'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid #e5e5e5',
          fontSize: '0.8rem',
          color: '#888',
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}>
          Sidekick Chat History
        </div>
      </div>
    </>
  );
}