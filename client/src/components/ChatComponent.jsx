import { useEffect, useRef, useState } from "react";
import { getSocket, initSocket } from "../lib/socket";
import { api } from "../lib/api";

export default function ChatComponent({ taskId, userId, userName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyToMessageId, setReplyToMessageId] = useState(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentDataUrl, setAttachmentDataUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket
    socketRef.current = initSocket();

    // Join task chat room
    socketRef.current.emit("join-task-chat", taskId);

    // Fetch existing messages
    fetchMessages();

    // Listen for incoming messages
    socketRef.current.on("receive-message", (data) => {
      setMessages((prev) => [...prev, { ...data, replies: [], read_count: 0 }]);
    });

    // Listen for typing indicators
    socketRef.current.on("user-typing", (data) => {
      setTypingUsers((prev) => new Set([...prev, data.userName]));
    });

    socketRef.current.on("user-stop-typing", (data) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userName);
        return newSet;
      });
    });

    // Listen for read receipts
    socketRef.current.on("read-receipt", (data) => {
      setMessages((prev) =>
        updateReadCount(prev, data.messageId)
      );
    });

    return () => {
      socketRef.current?.off("receive-message");
      socketRef.current?.off("user-typing");
      socketRef.current?.off("user-stop-typing");
      socketRef.current?.off("read-receipt");
    };
  }, [taskId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/messages/${taskId}`);
      setMessages(response.data.messages || []);
      markVisibleMessagesAsRead(response.data.messages || []);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const markVisibleMessagesAsRead = async (loadedMessages) => {
    const unreadMessages = flattenMessages(loadedMessages).filter(
      (message) => (message.userId ?? message.sender_id) !== userId
    );
    await Promise.all(
      unreadMessages.map(async (message) => {
        try {
          await api.post(`/messages/${message.id}/read`);
          socketRef.current?.emit("message-read", { taskId, messageId: message.id });
        } catch (error) {
          console.error("Failed to mark message as read:", error);
        }
      })
    );
  };

  const flattenMessages = (items) => {
    const result = [];
    items.forEach((item) => {
      result.push(item);
      if (Array.isArray(item.replies) && item.replies.length > 0) {
        result.push(...flattenMessages(item.replies));
      }
    });
    return result;
  };

  const updateReadCount = (items, messageId) => {
    return items.map((item) => {
      if (item.id === messageId) {
        return { ...item, read_count: (item.read_count || 0) + 1 };
      }

      if (Array.isArray(item.replies) && item.replies.length > 0) {
        return { ...item, replies: updateReadCount(item.replies, messageId) };
      }

      return item;
    });
  };

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setAttachmentName("");
      setAttachmentDataUrl("");
      return;
    }

    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentDataUrl(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() && !attachmentDataUrl) return;

    const payload = {
      taskId,
      message: newMessage,
      userId,
      userName,
      fileUrl: attachmentDataUrl || null,
      parentMessageId: replyToMessageId,
    };

    // Emit message via socket
    socketRef.current?.emit("send-message", payload);

    // Also save to database
    api.post(`/messages/${taskId}`, {
      content: newMessage,
      fileUrl: attachmentDataUrl || null,
      parentMessageId: replyToMessageId,
    })
      .then(() => fetchMessages())
      .catch((error) => {
        console.error("Failed to save message:", error);
      });

    setNewMessage("");
    setAttachmentDataUrl("");
    setAttachmentName("");
    setReplyToMessageId(null);
    socketRef.current?.emit("stop-typing", { taskId, userName });
  };

  const handleTyping = () => {
    socketRef.current?.emit("typing", { taskId, userName });
  };

  return (
    <div className="flex flex-col h-96 border border-white/10 rounded-lg bg-surface/80">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <p className="text-sm text-text/60">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-text/60">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              userId={userId}
              onReply={() => setReplyToMessageId(msg.id)}
              onShowAttachment={() => window.open(msg.file_url, "_blank")}
              renderReplies
            />
          ))
        )}

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <p className="text-xs text-muted italic">
            {Array.from(typingUsers).join(", ")} {typingUsers.size === 1 ? "is" : "are"} typing...
          </p>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 p-4 bg-obsidian/90">
        {replyToMessageId && (
          <div className="mb-2 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs text-neon">
            <span>Replying to message #{replyToMessageId}</span>
            <button type="button" onClick={() => setReplyToMessageId(null)} className="font-semibold">
              Cancel reply
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-white/10 rounded-lg text-sm bg-surface/80 text-text focus:outline-none focus:ring-2 focus:ring-neon/50"
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-neon text-obsidian rounded-lg text-sm hover:bg-neon/90 transition"
          >
            Send
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-xs text-text/60">
            Attachment
            <input type="file" className="ml-2 text-xs" onChange={handleAttachmentChange} />
          </label>
          {attachmentName && <span className="text-xs text-text/60">Selected: {attachmentName}</span>}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, userId, onReply, onShowAttachment }) {
  const isMine = msg.userId === userId || msg.sender_id === userId;

  return (
    <div className={`space-y-2 ${isMine ? "text-right" : "text-left"}`}>
      <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-xs rounded-lg px-3 py-2 ${isMine ? "bg-neon/15 text-text border border-neon/25" : "bg-white/5 text-text border border-white/10"}`}>
          <p className="text-xs font-semibold">{msg.userName || msg.sender_name}</p>
          {msg.message && <p className="text-sm">{msg.message}</p>}
          {msg.content && <p className="text-sm">{msg.content}</p>}
          {msg.file_url && (
            <button type="button" onClick={onShowAttachment} className="mt-2 text-xs font-semibold text-neon underline">
              Open attachment
            </button>
          )}
          <p className="mt-1 text-xs text-muted">
            {new Date(msg.timestamp || msg.created_at).toLocaleTimeString()}
          </p>
          {isMine && Number(msg.read_count || 0) > 0 && <p className="text-[11px] text-neon">Read</p>}
        </div>
      </div>

      <div className={`${isMine ? "flex justify-end" : "flex justify-start"}`}>
        <button type="button" onClick={onReply} className="text-[11px] text-muted hover:text-text">
          Reply
        </button>
      </div>

      {Array.isArray(msg.replies) && msg.replies.length > 0 && (
        <div className={`${isMine ? "mr-4" : "ml-4"} space-y-2 border-l border-white/10 pl-3`}>
          {msg.replies.map((reply) => (
            <MessageBubble key={reply.id} msg={reply} userId={userId} onReply={onReply} onShowAttachment={onShowAttachment} />
          ))}
        </div>
      )}
    </div>
  );
}
