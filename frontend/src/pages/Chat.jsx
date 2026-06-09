import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Chat.css";
import api from "../services/api";

const SUGGESTIONS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
    ),
    title: "Summarize",
    sub: "the uploaded document",
    prompt: "Summarize the uploaded document",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.39 7.36H22l-6.2 4.5L18.18 21 12 16.5 5.82 21l2.38-7.14L2 9.36h7.61z"/></svg>
    ),
    title: "Key points",
    sub: "from this document",
    prompt: "What are the key points?",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    ),
    title: "Explain simply",
    sub: "like I'm a beginner",
    prompt: "Explain this in simple terms",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
    ),
    title: "Action items",
    sub: "extracted from text",
    prompt: "List action items from this document",
  },
];

function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z"/>
    </svg>
  );
}

function formatTime(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function parseInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={j}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Unordered list item: *, -, or +
    if (/^[\*\-\+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[\*\-\+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[\*\-\+]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={i} style={{ paddingLeft: "20px", margin: "6px 0" }}>
          {items.map((item, j) => <li key={j} style={{ marginBottom: "4px" }}>{parseInline(item)}</li>)}
        </ul>
      );
      continue;
    }

    // Ordered list item: 1. 2. etc
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      elements.push(
        <ol key={i} style={{ paddingLeft: "20px", margin: "6px 0" }}>
          {items.map((item, j) => <li key={j} style={{ marginBottom: "4px" }}>{parseInline(item)}</li>)}
        </ol>
      );
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const Tag = `h${level}`;
      const sizes = { 1: "18px", 2: "16px", 3: "15px" };
      elements.push(
        <Tag key={i} style={{ fontSize: sizes[level], fontWeight: 700, margin: "10px 0 4px", color: "#fff" }}>
          {parseInline(headingMatch[2])}
        </Tag>
      );
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: "8px" }} />);
      i++;
      continue;
    }

    // Regular paragraph line
    elements.push(<p key={i} style={{ margin: "2px 0", lineHeight: "1.8" }}>{parseInline(line)}</p>);
    i++;
  }

  return elements;
}

function timeAgo(date) {
  if (!date) return "";
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(null);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const [currentChatId, setCurrentChatId] = useState(null);

  // Read user info saved to localStorage at login time
  const userName = localStorage.getItem("userName") || "User";
  const userEmail = localStorage.getItem("userEmail") || "user@example.com";

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    loadHistory();
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  const loadHistory = async () => {
    try {
      const { data } = await api.get("/api/chat/history");
      setHistory(data.chats || []);
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setError("");
    setInput("");
    const ts = new Date();
    setMessages((m) => [...m, { role: "user", content: q, doc: activeDoc?.fileName, time: ts }]);
    setLoading(true);
    try {
      const { data } = await api.post("/api/chat", {
        question: q,
        chatId: currentChatId,
        documentId: activeDoc?._id,
      });
      if (data.chatId) setCurrentChatId(data.chatId);
      const answer = data.answer || data.response || "No response";
      setMessages((m) => [...m, { role: "assistant", content: answer, time: new Date() }]);
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to get response");
      setMessages((m) => [...m, { role: "assistant", content: "⚠️ Something went wrong. Please try again.", time: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      setUploading(true);
      setError("");
      const { data } = await api.post("/api/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const doc = data?.document || data;
      setActiveDoc(doc || { fileName: file.name });
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const newChat = () => {
    setMessages([]);
    setActiveDoc(null);
    setCurrentChatId(null);
    setError("");
    textareaRef.current?.focus();
  };

  const loadChat = async (chatId) => {
    const { data } = await api.get(`/api/chat/${chatId}`);
    setCurrentChatId(chatId);
    const formattedMessages = data.chat.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      time: msg.createdAt ? new Date(msg.createdAt) : null,
    }));
    setMessages(formattedMessages);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = (content, idx) => {
    navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="chat-app">
      <div className="ambient-bg" aria-hidden="true">
        <div className="glow glow-1" />
        <div className="glow glow-2" />
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon"><SparkleIcon /></div>
          <span className="logo-text">DocuMind AI</span>
        </div>

        {/* New Chat */}
        <div className="sidebar-top">
          <button className="new-chat-btn" onClick={newChat}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>New chat</span>
          </button>
        </div>

        {/* History */}
        <div className="sidebar-section flex-1">
          <div className="section-title">Chat history</div>
          <ul className="history-list">
            {history.map((chat) => (
              <li
                key={chat._id}
                onClick={() => loadChat(chat._id)}
                className={chat._id === currentChatId ? "active" : ""}
              >
                <div className="history-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div className="history-text">
                  <span className="history-title">{chat.title}</span>
                  <span className="history-time">{timeAgo(chat.updatedAt || chat.createdAt)}</span>
                </div>
                <button className="history-menu-btn" onClick={(e) => e.stopPropagation()} aria-label="More options">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                </button>
              </li>
            ))}
            {history.length === 0 && <li className="muted">No previous chats</li>}
          </ul>
        </div>

        {/* User Profile */}
        <div className="sidebar-profile">
          <div className="profile-avatar">{userName.charAt(0).toUpperCase()}</div>
          <div className="profile-info">
            <span className="profile-name">{userName}</span>
            <span className="profile-email">{userEmail}</span>
          </div>
          <button className="profile-chevron" aria-label="Profile options">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>

        {/* Logout */}
        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={logout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="chat-main">
        {/* Header */}
        <header className="chat-header">
          <button className="toggle-btn" onClick={() => setSidebarOpen((s) => !s)} aria-label="Toggle sidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <h2>DocuMind AI</h2>
          <div className="header-actions">
            <button className="header-icon-btn" aria-label="Theme">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            </button>
            <button className="header-icon-btn" aria-label="Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </button>
          </div>
        </header>

        {/* Active Document Banner */}
        {activeDoc && (
          <div className="doc-banner">
            <div className="doc-banner-left">
              <div className="doc-pdf-icon">PDF</div>
              <div className="doc-info">
                <span className="doc-name">{activeDoc.fileName || activeDoc.originalName || "Document"}</span>
                <span className="doc-meta">
                  PDF
                  {activeDoc.size ? ` • ${(activeDoc.size / (1024 * 1024)).toFixed(1)} MB` : ""}
                  {activeDoc.pages ? ` • ${activeDoc.pages} pages` : ""}
                </span>
              </div>
            </div>
            <button className="change-doc-btn" onClick={() => { setActiveDoc(null); fileInputRef.current?.click(); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
              Change Document
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="messages" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="orb" aria-hidden="true">
                <div className="orb-inner" />
                <div className="orb-ring" />
              </div>
              <h1>How can I help you today?</h1>
              <p>Attach a document and ask anything about it.</p>
              <div className="suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s.title} onClick={() => { setInput(s.prompt); textareaRef.current?.focus(); }}>
                    <span className="sugg-icon">{s.icon}</span>
                    <span className="sugg-text">
                      <strong>{s.title}</strong>
                      <span>{s.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`message ${m.role}`}>
                {m.role === "assistant" && (
                  <div className="avatar ai-avatar"><SparkleIcon /></div>
                )}
                <div className="bubble-wrap">
                  <div className="bubble">
                    {m.role === "assistant" ? renderMarkdown(m.content) : m.content}
                  </div>
                  {m.role === "user" && m.time && (
                    <div className="msg-meta user-meta">
                      <span>{formatTime(m.time)}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="check-icon"><polyline points="20 6 9 17 4 12"/><polyline points="20 6 9 17 4 12" style={{transform:"translateX(4px)"}}/></svg>
                    </div>
                  )}
                  {m.role === "assistant" && (
                    <div className="msg-actions">
                      <button className="action-btn" onClick={() => copyMessage(m.content, i)} title="Copy">
                        {copiedIdx === i ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c5cff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        )}
                      </button>
                      <button className="action-btn" title="Helpful">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                      </button>
                      <button className="action-btn" title="Not helpful">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="message assistant">
              <div className="avatar ai-avatar"><SparkleIcon /></div>
              <div className="bubble-wrap">
                <div className="bubble typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <div className="error-bar">{error}</div>}

        {/* Composer */}
        <div className="composer-wrap">
          <div className="composer">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleUpload}
              hidden
            />
            <div className="composer-row">
              <button
                type="button"
                className="icon-btn attach-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Attach document"
              >
                {uploading ? (
                  <span className="spinner" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                )}
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Message AI..."
                rows={1}
              />
              <button
                type="button"
                className="send-btn"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                aria-label="Send"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
              </button>
            </div>
          </div>
          <div className="footer-note">AI can make mistakes. Verify important info.</div>
        </div>
      </main>
    </div>
  );
}
