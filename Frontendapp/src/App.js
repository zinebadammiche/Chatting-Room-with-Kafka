import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";

// Couleurs pour chaque utilisateur
const COLORS = ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#FF33A8", "#33FFF3"];

// Fonction pour générer un avatar aléatoire (initiale)
const getAvatar = (name) => {
  return name.charAt(0).toUpperCase();
};

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");
  const [socket, setSocket] = useState(null);
  const [userColors, setUserColors] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!username) return;

    const ws = new WebSocket("ws://localhost:8000/ws/chat");
    ws.onmessage = (event) => {
      const [user, ...msgParts] = event.data.split(": ");
      const msg = msgParts.join(": ");

      // Assign color if new user
      setUserColors((prev) => {
        if (!prev[user]) {
          const color = COLORS[Object.keys(prev).length % COLORS.length];
          return { ...prev, [user]: color };
        }
        return prev;
      });

      setMessages((prev) => [...prev, { user, msg }]);
    };
    setSocket(ws);

    return () => ws.close();
  }, [username]);

  const sendMessage = async () => {
    if (!input || !username) return;
    await fetch("http://localhost:8000/send/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, message: input }),
    });
    setInput("");
  };

  return (
    <div className="chat-container">
      {!username ? (
        <div className="login-box">
          <h2>Enter your username</h2>
          <input
            className="login-input"
            placeholder="Username"
            onBlur={(e) => setUsername(e.target.value.trim())}
          />
        </div>
      ) : (
        <>
          <div className="chat-box">
            <ul className="chat-messages">
              {messages.map((m, idx) => (
                <li
                  key={idx}
                  className={m.user === username ? "message message-sent" : "message message-received"}
                >
                  <div
                    className="avatar"
                    style={{ backgroundColor: userColors[m.user] || "#ccc" }}
                  >
                    {getAvatar(m.user)}
                  </div>
                  <div className="message-content">
                    <span className="username" style={{ color: userColors[m.user] || "#000" }}>
                      {m.user}
                    </span>
                    <span className="text">{m.msg}</span>
                  </div>
                </li>
              ))}
              <div ref={messagesEndRef} />
            </ul>
          </div>
          <div className="input-box">
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button className="send-btn" onClick={sendMessage}>
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
