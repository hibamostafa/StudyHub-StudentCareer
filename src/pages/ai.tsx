import React, { useState, useEffect, useRef } from "react";
import "./ai.css";
import { Bot, User, Paperclip, Copy, ArrowUp, Trash2, PlusSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

type Message = {
  text: string;
  sender: "user" | "bot";
  image?: string; // Added image support to the message type
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
};

const TypingIndicator = () => (
  <div className="typing-indicator">
    <span /> <span /> <span />
  </div>
);

export default function Ai() {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
const handleOpenFiles = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  
  input.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement | null; // cast to HTMLInputElement
    if (!target) return; // safety check

    const files = target.files;
    if (files) {
      console.log(files); // handle your files here
    }
  };

  input.click();
};

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("chatHistorySidebar");
      if (savedHistory) {
        setChatHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load or parse chat history:", error);
    }
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem("chatHistorySidebar", JSON.stringify(chatHistory));
    } else {
      localStorage.removeItem("chatHistorySidebar");
    }
  }, [chatHistory]);

  // Restore active chat ID
  useEffect(() => {
    const savedActiveId = localStorage.getItem("activeChatId");
    if (!activeChatId && savedActiveId) {
      const exists = chatHistory.some((chat) => chat.id === savedActiveId);
      if (exists) {
        setActiveChatId(savedActiveId);
      }
    }
  }, [chatHistory, activeChatId]);

  // Update messages when active chat changes
  useEffect(() => {
    const activeChat = chatHistory.find((chat) => chat.id === activeChatId);
    setMessages(activeChat ? activeChat.messages : []);
    if (activeChatId) {
      localStorage.setItem("activeChatId", activeChatId);
    } else {
      localStorage.removeItem("activeChatId");
    }
  }, [activeChatId, chatHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);



  // Handle send message
  const handleSend = async (textToSend?: string): Promise<void> => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    const userMessage: Message = { text: messageText, sender: "user" };
    setInput("");
    setIsTyping(true);

    let chatId = activeChatId;
    if (!chatId) {
      chatId = Date.now().toString();
      const newChatSession: ChatSession = {
        id: chatId,
        title: messageText.substring(0, 40) + "...",
        messages: [userMessage],
      };
      setChatHistory((prev) => [newChatSession, ...prev]);
      setActiveChatId(chatId);
    } else {
      setChatHistory((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, messages: [...chat.messages, userMessage] } : chat
        )
      );
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: messageText }],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const botReply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't understand the response. ❌";

      const botMessage: Message = { text: botReply, sender: "bot" };

      setChatHistory((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, messages: [...chat.messages, botMessage] } : chat
        )
      );
    } catch (error) {
      console.error("API Error:", error);
      const errorMessage: Message = {
        text: "Failed to connect to Gemini. Check your API key or internet. ❌",
        sender: "bot",
      };
      setChatHistory((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleOpenImages = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString();
      if (result) {
        const base64 = result.split(",")[1];
        handleSendWithImage(base64, file.type, input, result); // Pass full dataUrl for rendering
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendWithImage = async (base64Image: string, mimeType: string, text: string, fullDataUrl: string) => {
    const userMessage: Message = { 
        text: text || "Sent an image", 
        sender: "user", 
        image: fullDataUrl 
    };
    
    setInput("");
    setIsTyping(true);

    let chatId = activeChatId;
    if (!chatId) {
      chatId = Date.now().toString();
      const newChat: ChatSession = {
        id: chatId,
        title: (text || "Image conversation").substring(0, 40) + "...",
        messages: [userMessage],
      };
      setChatHistory((prev) => [newChat, ...prev]);
      setActiveChatId(chatId);
    } else {
      setChatHistory((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, messages: [...chat.messages, userMessage] } : chat
        )
      );
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: text || "Describe this image." },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Image,
                    },
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const botReply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't understand the image. ❌";

      const botMessage: Message = { text: botReply, sender: "bot" };

      setChatHistory((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, messages: [...chat.messages, botMessage] } : chat
        )
      );
    } catch (error) {
      console.error("Image API Error:", error);
      const errorMessage: Message = {
        text: "Failed to analyze image. Check API key or connection. ❌",
        sender: "bot",
      };
      setChatHistory((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setInput("");
    localStorage.removeItem("activeChatId");
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
  };

  const handleDeleteChat = (e: React.MouseEvent, chatIdToDelete: string) => {
    e.stopPropagation();
    const updatedHistory = chatHistory.filter((chat) => chat.id !== chatIdToDelete);
    setChatHistory(updatedHistory);

    if (activeChatId === chatIdToDelete) {
      handleNewChat();
    }
  };



  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Chat History</h2>
        </div>
        <div className="chat-history-list">
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              className={`chat-history-item ${chat.id === activeChatId ? "active" : ""}`}
              onClick={() => handleSelectChat(chat.id)}
            >
              <span className="chat-title">
                {chat.title} <small>({chat.messages.length})</small>
              </span>
              <button
                title="Delete chat"
                className="delete-chat-btn"
                onClick={(e) => handleDeleteChat(e, chat.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <button className="new-chat-btn" onClick={handleNewChat}>
            <PlusSquare size={20} />
            <span>New Chat</span>
          </button>
        </div>
      </aside>

      <div className="chat-area">
        <header className="chat-header">
          <Bot size={28} className="header-icon" />
          <h1 className="h1-robot">AI Assistant</h1>
        </header>

        <div className="messages-list">
          {messages.length === 0 && !isTyping && (
            <div className="welcome-container">
              <img
                src="https://i.pinimg.com/originals/88/5c/b9/885cb9c22fe028b25db7ea87b1e301cd.gif"
                alt="AI"
                className="welcome-gif"
              />
              <h2>How can I help you today?</h2>
              <div className="suggestion-chips">
                <button onClick={() => handleSend("Tell me about courses")}>
                  Tell me about courses
                </button>
                <button onClick={() => handleSend("What jobs are available?")}>
                  What jobs are available?
                </button>
                <button onClick={() => handleSend("Explain a complex topic")}>
                  Explain a complex topic
                </button>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`message-row ${msg.sender}`}>
              {msg.sender === "bot" && (
                <div className="avatar bot-avatar">
                  <Bot size={20} />
                </div>
              )}
              <div className="message-content">
                {msg.sender === "user" ? (
                  <div className="user-bubble">
                    {/* Display the image if it exists in the message */}
                    {msg.image && (
                      <img 
                        src={msg.image} 
                        alt="Uploaded content" 
                        style={{ maxWidth: "100%", borderRadius: "8px", marginBottom: "8px", display: "block" }} 
                      />
                    )}
                    {msg.text}
                  </div>
                ) : (
                  <div className="bot-bubble">
                    <ReactMarkdown
                      children={msg.text}
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                        ul: ({ children }: any) => <ul style={{ paddingLeft: "20px", marginTop: "5px" }}>{children}</ul>,
                        ol: ({ children }: any) => <ol style={{ paddingLeft: "20px", marginTop: "5px" }}>{children}</ol>,
                        li: ({ children }: any) => <li style={{ marginBottom: "5px" }}>{children}</li>,
                        strong: ({ children }: any) => <span style={{ fontWeight: "700", color: "#0e0d0dff" }}>{children}</span>,
                      }}
                    />

                    <div className="message-actions">
                      {msg.text.includes("❌") ? (
                        <button
                          onClick={() => {
                            const prev = messages[idx - 1]?.text;
                            if (prev) handleSend(prev);
                          }}
                          className="retry-btn"
                          title="Retry"
                        >
                          <ArrowUp size={14} className="rotate-icon" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(msg.text);
                            alert("Copied!");
                          }}
                          className="copy-btn"
                          title="Copy"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === "user" && (
                <div className="avatar user-avatar">
                  <User size={20} />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="message-row bot typing-indicator-row">
              <div className="avatar bot-avatar">
                <Bot size={20} />
              </div>
              <div className="message-content">
                <div className="bot-bubble">
                  <TypingIndicator />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <footer className="chat-input-area">
          <div className="input-wrapper">
            <button
              className="icon-btn"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              title="Attach"
            >
              <PlusSquare size={20} />
            </button>
{showAttachMenu && (
  <div className="attach-menu">
    {/* Add photos option */}
    <button
      className="attach-item"
      onClick={() => {
        handleOpenImages();
        setShowAttachMenu(false);
      }}
    >
      <Paperclip size={16} />
      <span>Add photos</span>
    </button>

    {/* Add files option */}
    <button
      className="attach-item"
      onClick={() => {
        handleOpenFiles(); // create this function for handling files
        setShowAttachMenu(false);
      }}
    >
      <Paperclip size={16} />
      <span>Add files</span>
    </button>
  </div>
)}


            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: "none" }}
            />

            

            <input
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              onClick={() => handleSend()}
              className="icon-btn send-btn"
            >
              <ArrowUp size={20} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}