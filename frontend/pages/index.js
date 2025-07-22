import Head from "next/head";
import { useState } from "react";
import QueryBox from "@/components/queryBox";
import ChatSidebar from "@/components/ChatSidebar";
import ViewCorpus from "@/components/ViewCorpus";
import PrepInterview from "@/components/PrepInterview";
import { useConversations } from "@/hooks/useConversations";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('chat'); // 'chat', 'corpus', or 'prep'
  
  const {
    conversations,
    currentConversationId,
    createNewConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    addToCurrentConversation
  } = useConversations();

  return (
    <div>
      <Head>
        <title>Sidekick – Real-time meeting companion</title>
      </Head>

      {/* Chat Sidebar - only show in chat view */}
      {currentView === 'chat' && (
        <ChatSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={selectConversation}
          onNewConversation={createNewConversation}
          onDeleteConversation={deleteConversation}
          onRenameConversation={renameConversation}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      )}

      {/* Header - stays fixed */}
      <header style={{
        padding: "1rem 2rem",
        borderBottom: "1px solid #e5e5e5",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        fontFamily: "sans-serif",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "white",
        zIndex: 40
      }}>
{currentView === 'chat' && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "none",
              border: "1px solid #ddd",
              borderRadius: "6px",
              padding: "0.5rem",
              cursor: "pointer",
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px"
            }}
            title="Toggle chat history"
          >
            ☰
          </button>
        )}
        
        <div style={{ display: "flex", alignItems: "center", gap: "2rem", flex: 1 }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: "600", margin: 0 }}>
              Sidekick
            </h1>
            <p style={{ fontSize: "1rem", color: "#666", marginTop: "0.25rem", margin: 0 }}>
              Understand more. Ask better.
            </p>
          </div>
          
          {/* Navigation Tabs */}
          <div style={{
            display: "flex",
            background: "#f1f1f1",
            borderRadius: "8px",
            overflow: "hidden",
            marginLeft: "auto"
          }}>
            <button
              onClick={() => setCurrentView('chat')}
              style={{
                padding: "0.5rem 1rem",
                background: currentView === 'chat' ? "#4f46e5" : "transparent",
                color: currentView === 'chat' ? "white" : "#333",
                border: "none",
                cursor: "pointer",
                fontWeight: currentView === 'chat' ? "600" : "400",
                fontSize: "0.9rem"
              }}
            >
              Chat
            </button>
            <button
              onClick={() => setCurrentView('corpus')}
              style={{
                padding: "0.5rem 1rem",
                background: currentView === 'corpus' ? "#4f46e5" : "transparent",
                color: currentView === 'corpus' ? "white" : "#333",
                border: "none",
                cursor: "pointer",
                fontWeight: currentView === 'corpus' ? "600" : "400",
                fontSize: "0.9rem"
              }}
            >
              View Corpus
            </button>
            <button
              onClick={() => setCurrentView('prep')}
              style={{
                padding: "0.5rem 1rem",
                background: currentView === 'prep' ? "#4f46e5" : "transparent",
                color: currentView === 'prep' ? "white" : "#333",
                border: "none",
                cursor: "pointer",
                fontWeight: currentView === 'prep' ? "600" : "400",
                fontSize: "0.9rem"
              }}
            >
              Prep Interview
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ 
        paddingTop: "120px", // Account for fixed header height
        padding: (currentView === 'corpus' || currentView === 'prep') ? "200px 0 2rem 0" : "120px 2rem 2rem", 
        fontFamily: "sans-serif",
        marginLeft: (sidebarOpen && currentView === 'chat') ? '280px' : '0',
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh'
      }}>
        {currentView === 'chat' ? (
          <QueryBox 
            key={currentConversationId} // Force re-render when conversation changes
            conversationHistory={conversations.find(conv => conv.id === currentConversationId)?.history || []}
            onAddToConversation={addToCurrentConversation}
          />
        ) : currentView === 'corpus' ? (
          <ViewCorpus />
        ) : (
          <PrepInterview />
        )}
      </main>
    </div>
  );
}
