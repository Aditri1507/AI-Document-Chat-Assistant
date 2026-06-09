import React from "react";


function SparkleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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
    <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <SparkleIcon />
        </div>
        <span className="logo-text">DocuMind AI</span>
      </div>

      {/* New Chat */}
      <div className="sidebar-top">
        <button className="new-chat-btn" onClick={newChat}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>New Chat</span>
        </button>
      </div>

      {/* History */}
      <div className="sidebar-section flex-1">
        <div className="section-title">Chat History</div>

        <ul className="history-list">
          {history.map((chat) => (
            <li
              key={chat._id}
              onClick={() => loadChat(chat._id)}
              className={chat._id === currentChatId ? "active" : ""}
            >
              <div className="history-icon">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>

              <div className="history-text">
                <span className="history-title">{chat.title}</span>
                <span className="history-time">
                  {timeAgo(chat.updatedAt || chat.createdAt)}
                </span>
              </div>

              <button
                className="history-menu-btn"
                onClick={(e) => e.stopPropagation()}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="19" cy="12" r="1.5" />
                </svg>
              </button>
            </li>
          ))}

          {history.length === 0 && (
            <li className="muted">No previous chats</li>
          )}
        </ul>
      </div>

      {/* Profile */}
      <div className="sidebar-profile">
        <div className="profile-avatar">
          {userName?.charAt(0)?.toUpperCase()}
        </div>

        <div className="profile-info">
          <span className="profile-name">{userName}</span>
          <span className="profile-email">{userEmail}</span>
        </div>

        <button className="profile-chevron">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Logout */}
      <div className="sidebar-bottom">
        <button className="logout-btn" onClick={logout}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
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
