import Head from "next/head";
import { useState } from "react";
import QueryBox from "@/components/queryBox";
import ChatSidebar from "@/components/ChatSidebar";
import { useConversations } from "@/hooks/useConversations";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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

      {/* Chat Sidebar */}
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
        
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "600", margin: 0 }}>
            Sidekick
          </h1>
          <p style={{ fontSize: "1rem", color: "#666", marginTop: "0.25rem", margin: 0 }}>
            Understand more. Ask better.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ 
        paddingTop: "120px", // Account for fixed header height
        padding: "120px 2rem 2rem", 
        fontFamily: "sans-serif",
        marginLeft: sidebarOpen ? '280px' : '0',
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh'
      }}>
        <QueryBox 
          key={currentConversationId} // Force re-render when conversation changes
          conversationHistory={conversations.find(conv => conv.id === currentConversationId)?.history || []}
          onAddToConversation={addToCurrentConversation}
        />
      </main>
    </div>
  );
}
