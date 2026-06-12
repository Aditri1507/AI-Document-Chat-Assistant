import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";

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
      <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
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

    if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: "8px" }} />);
      i++;
      continue;
    }

    elements.push(<p key={i} style={{ margin: "2px 0", lineHeight: "1.8" }}>{parseInline(line)}</p>);
    i++;
  }

  return elements;
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
    <div className="flex h-screen w-screen font-[Inter,system-ui,sans-serif] text-[#ececec] bg-[#0d0d1a] overflow-hidden relative">

      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* glow-1 */}
        <div
          className="absolute rounded-full opacity-[0.18] blur-[120px] animate-[float_18s_ease-in-out_infinite]"
          style={{
            width: 420, height: 420,
            background: "radial-gradient(circle, #6d4aff 0%, transparent 70%)",
            top: -260, left: "30%",
          }}
        />
        {/* glow-2 */}
        <div
          className="absolute rounded-full opacity-[0.18] blur-[120px] animate-[float_18s_ease-in-out_infinite] [animation-delay:-6s]"
          style={{
            width: 480, height: 480,
            background: "radial-gradient(circle, #3b2fa0 0%, transparent 70%)",
            bottom: -160, right: "10%",
          }}
        />
      </div>

      {/* Keyframe styles injected once */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.08); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes orbSpin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.12); opacity: 0.2; }
        }
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1); }
        }
        .animate-fadeUp { animation: fadeUp 0.6s ease; }
        .animate-fadeUp-fast { animation: fadeUp 0.25s ease; }
        .orb-inner {
          position: absolute; inset: 8px; border-radius: 50%;
          background: conic-gradient(from 0deg, #7c5cff, #3b2fa0, #7c5cff);
          filter: blur(2px);
          animation: orbSpin 6s linear infinite;
          box-shadow: 0 0 40px rgba(124,92,255,0.45);
        }
        .orb-inner::after {
          content: ""; position: absolute; inset: 6px; border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #1a1a2e, #0d0d1a);
        }
        .orb-ring {
          position: absolute; inset: 0; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.08);
          animation: pulse 2.6s ease-in-out infinite;
        }
        .typing-dot { width: 7px; height: 7px; border-radius: 50%; background: #666; animation: blink 1.4s infinite both; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        .messages-scroll::-webkit-scrollbar { width: 4px; }
        .messages-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        @media (max-width: 768px) {
          .sidebar-mobile { position: absolute; height: 100%; z-index: 10; box-shadow: 4px 0 24px rgba(0,0,0,0.5); }
        }
      `}</style>

      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        history={history}
        currentChatId={currentChatId}
        loadChat={loadChat}
        newChat={newChat}
        logout={logout}
        userName={userName}
        userEmail={userEmail}
      />

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 relative z-[1] bg-[#0f0f1e]">

        {/* Header */}
        <header className="flex items-center gap-3 px-5 py-[14px] border-b border-white/[0.05] bg-[rgba(13,13,26,0.8)] backdrop-blur-[12px] z-[2]">
          <button
            className="bg-transparent border-none text-[#888] cursor-pointer p-[6px] rounded-lg flex items-center justify-center transition-colors duration-150 hover:bg-white/[0.06] hover:text-white"
            onClick={() => setSidebarOpen((s) => !s)}
            aria-label="Toggle sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <h2 className="m-0 text-[15px] font-bold tracking-[-0.2px] text-white flex-1">DocuMind AI</h2>
          <div className="flex gap-1">
            <button className="bg-transparent border-none text-[#888] w-[34px] h-[34px] rounded-lg flex items-center justify-center cursor-pointer transition-all duration-150 hover:bg-white/[0.06] hover:text-white" aria-label="Theme">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            </button>
            <button className="bg-transparent border-none text-[#888] w-[34px] h-[34px] rounded-lg flex items-center justify-center cursor-pointer transition-all duration-150 hover:bg-white/[0.06] hover:text-white" aria-label="Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </button>
          </div>
        </header>

        {/* Active Document Banner */}
        {activeDoc && (
          <div className="flex items-center justify-between mx-5 my-3 px-4 py-[14px] bg-[rgba(20,20,38,0.8)] border border-white/[0.08] rounded-[14px] backdrop-blur-[8px]">
            <div className="flex items-center gap-[14px]">
              <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[11px] font-[800] text-white tracking-[0.5px] flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #e53e3e, #c53030)" }}
              >
                PDF
              </div>
              <div className="flex flex-col gap-[3px]">
                <span className="text-sm font-semibold text-white">
                  {activeDoc.fileName || activeDoc.originalName || "Document"}
                </span>
                <span className="text-xs text-[#666]">
                  PDF
                  {activeDoc.size ? ` • ${(activeDoc.size / (1024 * 1024)).toFixed(1)} MB` : ""}
                  {activeDoc.pages ? ` • ${activeDoc.pages} pages` : ""}
                </span>
              </div>
            </div>
            <button
              onClick={() => { setActiveDoc(null); fileInputRef.current?.click(); }}
              className="bg-transparent border border-white/[0.1] text-[#9b7fff] text-[13px] font-medium px-[14px] py-2 rounded-[10px] cursor-pointer flex items-center gap-[6px] transition-all duration-[180ms] whitespace-nowrap hover:bg-[rgba(124,92,255,0.1)] hover:border-[rgba(124,92,255,0.35)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
              Change Document
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto pt-4 pb-2 min-h-0 messages-scroll" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="text-center max-w-[680px] mx-auto px-6 py-10 flex flex-col items-center animate-fadeUp">
              {/* Orb */}
              <div className="relative w-14 h-14 mb-4 grid place-items-center">
                <div className="orb-inner" />
                <div className="orb-ring" />
              </div>

              <h1
                className="text-[clamp(20px,2.4vw,28px)] font-bold m-0 mb-3 tracking-[-0.6px] bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(180deg, #fff 0%, #9a9a9a 100%)" }}
              >
                How can I help you today?
              </h1>
              <p className="text-[#666] m-0 mb-10 text-[14.5px] max-w-[400px]">
                Attach a document and ask anything about it.
              </p>

              <div className="grid grid-cols-2 gap-7 w-full max-w-[740px] mt-8 max-sm:grid-cols-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => { setInput(s.prompt); textareaRef.current?.focus(); }}
                    className="relative bg-white/[0.03] text-[#ececec] border border-white/[0.07] rounded-[18px] px-[26px] py-7 cursor-pointer text-left flex items-center gap-[18px] transition-all duration-200 overflow-hidden min-h-[90px] hover:border-[rgba(124,92,255,0.3)] hover:bg-[rgba(124,92,255,0.06)] hover:-translate-y-0.5"
                  >
                    <span className="w-[38px] h-[38px] flex-shrink-0 grid place-items-center rounded-[10px] bg-[rgba(124,92,255,0.12)] text-[#9b7fff] border border-[rgba(124,92,255,0.15)]">
                      {s.icon}
                    </span>
                    <span className="flex flex-col gap-1 min-w-0">
                      <strong className="text-sm font-semibold text-white">{s.title}</strong>
                      <span className="text-[12.5px] text-[#777]">{s.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 max-w-[900px] mx-auto px-7 py-2 animate-fadeUp-fast max-sm:px-4 ${
                  m.role === "user" ? "flex-row-reverse justify-start" : "items-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div
                    className="w-[34px] h-[34px] rounded-full flex-shrink-0 flex items-center justify-center border border-[rgba(124,92,255,0.4)] text-[#9b7fff] mt-0.5"
                    style={{ background: "linear-gradient(135deg, #2a1f5a 0%, #3d2d8a 100%)" }}
                  >
                    <SparkleIcon />
                  </div>
                )}
                <div
                  className={`flex flex-col ${
                    m.role === "user"
                      ? "items-end max-w-[75%]"
                      : "items-start w-full max-w-full"
                  }`}
                >
                  <div
                    className={
                      m.role === "user"
                        ? "text-white rounded-[18px_18px_4px_18px] px-4 py-3 text-[14.5px] leading-[1.6] whitespace-pre-wrap break-words"
                        : "bg-transparent text-[#ececec] text-[15px] leading-[1.8] break-words w-full"
                    }
                    style={
                      m.role === "user"
                        ? { background: "linear-gradient(135deg, #5a3ee8 0%, #4530c0 100%)" }
                        : {}
                    }
                  >
                    {m.role === "assistant" ? renderMarkdown(m.content) : m.content}
                  </div>

                  {m.role === "user" && m.time && (
                    <div className="flex items-center gap-1 text-[11px] text-[#555] mt-1 pr-0.5">
                      <span>{formatTime(m.time)}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c5cff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}

                  {m.role === "assistant" && (
                    <div className="flex gap-0.5 mt-2 pl-0.5">
                      <button
                        className="bg-transparent border-none text-[#666] cursor-pointer px-[7px] py-[5px] rounded-[7px] flex items-center justify-center transition-all duration-[120ms] hover:bg-white/[0.06] hover:text-[#ccc]"
                        onClick={() => copyMessage(m.content, i)}
                        title="Copy"
                      >
                        {copiedIdx === i ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c5cff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        )}
                      </button>
                      <button className="bg-transparent border-none text-[#666] cursor-pointer px-[7px] py-[5px] rounded-[7px] flex items-center justify-center transition-all duration-[120ms] hover:bg-white/[0.06] hover:text-[#ccc]" title="Helpful">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                      </button>
                      <button className="bg-transparent border-none text-[#666] cursor-pointer px-[7px] py-[5px] rounded-[7px] flex items-center justify-center transition-all duration-[120ms] hover:bg-white/[0.06] hover:text-[#ccc]" title="Not helpful">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3 max-w-[820px] mx-auto px-7 py-2 items-start">
              <div
                className="w-[34px] h-[34px] rounded-full flex-shrink-0 flex items-center justify-center border border-[rgba(124,92,255,0.4)] text-[#9b7fff] mt-0.5"
                style={{ background: "linear-gradient(135deg, #2a1f5a 0%, #3d2d8a 100%)" }}
              >
                <SparkleIcon />
              </div>
              <div className="flex flex-col items-start">
                <div className="flex gap-[5px] pt-[10px] pb-1">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error bar */}
        {error && (
          <div className="max-w-[820px] mx-auto mb-2 px-[14px] py-2 bg-red-600/10 text-red-300 border border-red-600/25 rounded-[10px] text-[13px]">
            {error}
          </div>
        )}

        {/* Composer */}
        <div
          className="px-5 pt-2 pb-[10px] max-sm:px-3"
          style={{ background: "linear-gradient(180deg, rgba(15,15,30,0) 0%, rgba(15,15,30,0.98) 35%)" }}
        >
          <div className="max-w-[820px] w-full mx-auto bg-[rgba(22,22,42,0.9)] backdrop-blur-[14px] border border-white/[0.08] rounded-[20px] px-[10px] py-[6px] pr-[6px] transition-all duration-[180ms] focus-within:border-[rgba(124,92,255,0.3)] focus-within:shadow-[0_0_0_4px_rgba(124,92,255,0.06)]">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleUpload}
              hidden
            />
            <div className="flex items-end gap-[6px]">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Attach document"
                className="bg-transparent border-none text-[#888] w-9 h-9 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0 transition-all duration-150 hover:bg-white/[0.07] hover:text-[#ccc] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <span
                    className="w-4 h-4 rounded-full border-2 border-white/15 border-t-[#ececec]"
                    style={{ animation: "spin 0.7s linear infinite" }}
                  />
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
                className="flex-1 bg-transparent border-none outline-none text-[#ececec] text-[15px] resize-none max-h-[200px] font-[inherit] leading-[1.5] py-2 px-1 min-h-6 placeholder:text-[#555]"
              />

              <button
                type="button"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                aria-label="Send"
                className="text-white border-none rounded-full w-[34px] h-[34px] cursor-pointer flex-shrink-0 flex items-center justify-center mb-px transition-all duration-[180ms] shadow-[0_4px_14px_rgba(124,92,255,0.35)] hover:not(:disabled):-translate-y-px hover:not(:disabled):shadow-[0_6px_20px_rgba(124,92,255,0.5)] disabled:bg-white/[0.07] disabled:text-[#555] disabled:cursor-not-allowed disabled:shadow-none"
                style={{ background: loading || !input.trim() ? undefined : "linear-gradient(135deg, #7c5cff 0%, #5a3ee8 100%)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
              </button>
            </div>
          </div>
          <div className="text-center text-[11px] text-[#444] py-2">
            AI can make mistakes. Verify important info.
          </div>
        </div>
      </main>
    </div>
  );
}
