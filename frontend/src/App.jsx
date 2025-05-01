import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const LS_KEY = "pirate-chat-sessions";
const functionUrl = "https://ahoybot.onrender.com/chat";

// Format timestamp for chat titles
function formatTime(timestamp) {
  const date = new Date(parseInt(timestamp));
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAllSessions() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.error("Error loading chat sessions:", error);
    return {};
  }
}

function App() {
  const [sessions, setSessions] = useState({});
  const [currentId, setCurrentId] = useState("");
  const [newInputValue, setNewInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load sessions on mount
  useEffect(() => {
    try {
      const all = getAllSessions();
      console.log("Loaded sessions from localStorage:", all);

      // If there are no sessions, create one
      if (!all || Object.keys(all).length === 0) {
        const newSessions = {};
        const newId = "chat-" + Date.now();
        newSessions[newId] = [];

        setSessions(newSessions);
        setCurrentId(newId);

        // Save immediately to localStorage
        localStorage.setItem(LS_KEY, JSON.stringify(newSessions));
        console.log(
          "Created new session and saved to localStorage:",
          newSessions,
        );
      } else {
        // Set the loaded sessions
        setSessions(all);

        // Use the most recent session
        const sortedKeys = Object.keys(all).sort((a, b) => {
          const aTime = a.replace("chat-", "");
          const bTime = b.replace("chat-", "");
          return parseInt(bTime) - parseInt(aTime);
        });

        setCurrentId(sortedKeys[0]);
      }
    } catch (error) {
      console.error("Error initializing sessions:", error);
      // Create a fallback session
      const newId = "chat-" + Date.now();
      const fallbackSessions = { [newId]: [] };
      setSessions(fallbackSessions);
      setCurrentId(newId);
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    try {
      if (Object.keys(sessions).length > 0) {
        localStorage.setItem(LS_KEY, JSON.stringify(sessions));
        console.log("Saved sessions to localStorage:", sessions);
      }
    } catch (error) {
      console.error("Error saving chat sessions:", error);
    }
  }, [sessions]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sessions, currentId]);

  // Focus input when session changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentId]);

  // Create a new session and optionally skip setting state (for initial load)
  function createNewSession(existing = sessions, skipState = false) {
    const newId = "chat-" + Date.now();
    const newSessions = { ...existing, [newId]: [] };
    if (!skipState) {
      setSessions(newSessions);
      setCurrentId(newId);
    }
    return newId;
  }

  // Delete a session
  function deleteSession(id, e) {
    e.stopPropagation(); // Prevent triggering the parent onClick
    const { [id]: _, ...rest } = sessions;
    setSessions(rest);

    if (id === currentId) {
      const remaining = Object.keys(rest);
      if (remaining.length > 0) {
        // Sort by timestamp to get the most recent chat
        const sortedKeys = remaining.sort((a, b) => {
          const aTime = a.replace("chat-", "");
          const bTime = b.replace("chat-", "");
          return parseInt(bTime) - parseInt(aTime);
        });
        setCurrentId(sortedKeys[0]);
      } else {
        createNewSession(rest);
      }
    }
  }

  // Send a new message
  const newMessage = async (e) => {
    e.preventDefault();
    if (!newInputValue.trim() || !currentId || loading) return;

    const userMessage = {
      text: newInputValue,
      sender: "user",
      timestamp: Date.now(),
    };

    const updated = [...(sessions[currentId] || []), userMessage];
    setSessions((prev) => ({ ...prev, [currentId]: updated }));
    setNewInputValue("");
    setLoading(true);

    try {
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });

      const data = await response.json();
      setSessions((prev) => ({
        ...prev,
        [currentId]: [
          ...updated,
          {
            text: data.text,
            sender: "ai",
            timestamp: Date.now(),
          },
        ],
      }));
    } catch (error) {
      setSessions((prev) => ({
        ...prev,
        [currentId]: [
          ...updated,
          {
            text: "Arrr, there be an error in the communication! Try again, matey!",
            sender: "ai",
            timestamp: Date.now(),
          },
        ],
      }));
    } finally {
      setLoading(false);
    }
  };

  // Truncate chat title to a reasonable length
  const getChatTitle = (id) => {
    const timestamp = id.replace("chat-", "");
    return formatTime(timestamp);
  };

  // Get first message to use as title preview
  const getChatPreview = (chatId) => {
    const messages = sessions[chatId] || [];
    if (messages.length === 0) return "New conversation";

    // Get the first user message
    const firstUserMsg = messages.find((msg) => msg.sender === "user");
    if (!firstUserMsg) return "New conversation";

    const preview = firstUserMsg.text;
    if (preview.length > 25) {
      return preview.substring(0, 25) + "...";
    }
    return preview;
  };

  const messages = sessions[currentId] || [];

  return (
    <div className="app-root">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>AhoyBot</h2>
          <button
            className="new-chat-btn"
            onClick={() => createNewSession()}
            aria-label="Create new chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Chat
          </button>
        </div>

        <div className="chat-list">
          {Object.keys(sessions).length === 0 ? (
            <div className="empty-chats">No chats yet</div>
          ) : (
            Object.keys(sessions)
              .sort((a, b) => {
                const aTime = a.replace("chat-", "");
                const bTime = b.replace("chat-", "");
                return parseInt(bTime) - parseInt(aTime);
              })
              .map((id) => (
                <div
                  key={id}
                  className={`chat-list-item${id === currentId ? " active" : ""}`}
                  onClick={() => setCurrentId(id)}
                >
                  <div className="chat-list-content">
                    <span className="chat-list-title" title={id}>
                      {getChatTitle(id)}
                    </span>
                    <span className="chat-list-preview">
                      {getChatPreview(id)}
                    </span>
                  </div>
                  <button
                    className="delete-chat-btn"
                    onClick={(e) => deleteSession(id, e)}
                    title="Delete chat"
                    disabled={Object.keys(sessions).length === 1}
                    aria-label="Delete chat"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              ))
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <main className="app-container">
        <header className="chat-header">
          <h1>AhoyBot</h1>
          <div className="chat-subtitle">Talk like a pirate, matey! Arrr!</div>
        </header>

        <section className="messages-section">
          {messages.length === 0 ? (
            <div className="empty-chat">
              <div className="empty-chat-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h3 className="empty-chat-title">Ahoy there, matey!</h3>
              <p className="empty-chat-text">
                Start a conversation with the Pirate Bot! Ask it something, and
                it will respond in pirate speak.
              </p>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message, idx) => (
                <div key={idx} className={`message-wrapper ${message.sender}`}>
                  <div className="message">
                    <div className="message-text">{message.text}</div>
                    {message.timestamp && (
                      <div className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </section>

        <form className="input-form" onSubmit={newMessage}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Send a message..."
            value={newInputValue}
            onChange={(e) => setNewInputValue(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            disabled={!newInputValue.trim() || loading}
            className={loading ? "loading" : ""}
          >
            {loading ? (
              <svg
                className="loading-icon"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  strokeWidth="4"
                  stroke="currentColor"
                  strokeDasharray="30 90"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

export default App;
