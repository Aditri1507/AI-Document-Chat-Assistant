import React from "react";

function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
    </svg>
  );
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

export default function Sidebar({
  sidebarOpen,
  history,
  currentChatId,
  loadChat,
  newChat,
  logout,
  userName,
  userEmail,
}) {
  return (
    <aside
      style={{
        width: sidebarOpen ? "300px" : "0px",
        borderRight: sidebarOpen ? "1px solid rgba(255,255,255,0.06)" : "none",
        background: "rgba(10,10,20,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        transition: "width 0.25s ease",
        flexShrink: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        zIndex: 2,
      }}
    >
      {/* Logo */}
      <div
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        className="flex items-center gap-[10px] px-4 pt-[18px] pb-[14px]"
      >
        <div
          className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #7c5cff 0%, #4a34c8 100%)" }}
        >
          <SparkleIcon />
        </div>
        <span className="text-[15px] font-bold text-white whitespace-nowrap" style={{ letterSpacing: "-0.3px" }}>
          DocuMind AI
        </span>
      </div>

      {/* New Chat */}
      <div className="px-3 pt-[14px] pb-2">
        <button
          onClick={newChat}
          className="w-full text-[#c4b5fd] rounded-xl px-[14px] py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
          style={{
            background: "rgba(124,92,255,0.15)",
            border: "1px solid rgba(124,92,255,0.22)",
            transition: "all 0.18s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(124,92,255,0.25)";
            e.currentTarget.style.borderColor = "rgba(124,92,255,0.4)";
            e.currentTarget.style.color = "#e0d4ff";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(124,92,255,0.15)";
            e.currentTarget.style.borderColor = "rgba(124,92,255,0.22)";
            e.currentTarget.style.color = "#c4b5fd";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>New Chat</span>
        </button>
      </div>

      {/* History */}
      <div
        className="flex-1 overflow-y-auto px-[10px] pt-[14px] pb-[10px]"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}
      >
        <div
          className="text-[11px] uppercase mx-2 mb-[10px] font-semibold"
          style={{ color: "#555", letterSpacing: "0.8px" }}
        >
          Chat History
        </div>

        <ul className="list-none p-0 m-0 flex flex-col gap-0.5">
          {history.map((chat) => {
            const isActive = chat._id === currentChatId;
            return (
              <li
                key={chat._id}
                onClick={() => loadChat(chat._id)}
                className="group px-[10px] py-[9px] rounded-[10px] cursor-pointer flex items-center gap-[10px] relative"
                style={{
                  background: isActive ? "rgba(124,92,255,0.15)" : "transparent",
                  color: isActive ? "#fff" : "#b0b0b0",
                  border: isActive ? "1px solid rgba(124,92,255,0.25)" : "1px solid transparent",
                  transition: "background 0.12s ease, color 0.12s ease",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#b0b0b0"; } }}
              >
                <div className="flex-shrink-0 flex items-center" style={{ color: isActive ? "#9b7fff" : "#666" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>

                <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                  <span
                      className="text-[13px] whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ fontWeight: 700 }}
                    >

                    {chat.title}
                  </span>
                  <span className="text-[11px]" style={{ color: isActive ? "#9b7fff" : "#555", opacity: isActive ? 0.7 : 1 }}>
                    {timeAgo(chat.updatedAt || chat.createdAt)}
                  </span>
                </div>

                <button
                  className="flex items-center flex-shrink-0 rounded opacity-0 group-hover:opacity-100 px-1 py-0.5"
                  style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer", transition: "opacity 0.12s, color 0.12s" }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                  onMouseLeave={e => e.currentTarget.style.color = "#666"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="5" cy="12" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="19" cy="12" r="1.5" />
                  </svg>
                </button>
              </li>
            );
          })}

          {history.length === 0 && (
            <li className="px-[10px] py-[9px] text-sm italic cursor-default" style={{ color: "#5a5a5a" }}>
              No previous chats
            </li>
          )}
        </ul>
      </div>

      {/* Profile */}
      <div
        className="flex items-center gap-[10px] px-[14px] py-3 cursor-pointer"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)", transition: "background 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div
          className="w-8 h-8 rounded-full text-white text-[13px] font-bold flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #7c5cff, #4a34c8)" }}
        >
          {userName?.charAt(0)?.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0 flex flex-col" style={{ gap: "1px" }}>
          <span className="text-[13px] font-semibold text-[#ececec] whitespace-nowrap overflow-hidden text-ellipsis">
            {userName}
          </span>
          <span className="text-[11px] whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: "#666" }}>
            {userEmail}
          </span>
        </div>

        <button
          className="flex items-center flex-shrink-0"
          style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Logout */}
      <div className="px-3 pb-[14px] pt-2">
        <button
          onClick={logout}
          className="w-full px-3 py-[9px] rounded-[10px] text-[13px] flex items-center justify-center gap-2 cursor-pointer"
          style={{
            background: "transparent",
            color: "#888",
            border: "1px solid rgba(255,255,255,0.07)",
            transition: "all 0.18s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#888"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
