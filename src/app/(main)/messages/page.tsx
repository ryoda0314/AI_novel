"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Send, MessageSquare, ArrowLeft } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface Conversation {
  user: { id: string; name: string; avatarUrl: string | null };
  lastMessage: string;
  lastAt: string;
  unread: number;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; avatarUrl: string | null };
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-[var(--color-muted)] rounded-xl" />}>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialWith = searchParams.get("with");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeUser, setActiveUser] = useState<string>(initialWith || "");
  const [activeUserName, setActiveUserName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 会話リスト取得
  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/messages")
      .then(r => r.json())
      .then(setConversations);
  }, [session]);

  // メッセージ取得
  useEffect(() => {
    if (!activeUser) return;
    fetch(`/api/messages?with=${activeUser}`)
      .then(r => r.json())
      .then((data) => {
        setMessages(data);
        // 会話リストの未読をリセット
        setConversations(prev =>
          prev.map(c => c.user.id === activeUser ? { ...c, unread: 0 } : c)
        );
      });
  }, [activeUser]);

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // initialWith のユーザー名を取得
  useEffect(() => {
    if (initialWith) {
      fetch(`/api/users/${initialWith}`)
        .then(r => r.json())
        .then(data => setActiveUserName(data.name || ""));
    }
  }, [initialWith]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeUser) return;
    setSending(true);

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: activeUser, content: newMessage }),
    });

    if (res.ok) {
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setNewMessage("");

      // 会話リストを更新
      setConversations(prev => {
        const exists = prev.find(c => c.user.id === activeUser);
        if (exists) {
          return prev.map(c =>
            c.user.id === activeUser ? { ...c, lastMessage: msg.content, lastAt: msg.createdAt } : c
          );
        }
        return prev;
      });
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectConversation = (conv: Conversation) => {
    setActiveUser(conv.user.id);
    setActiveUserName(conv.user.name);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare size={24} /> メッセージ
      </h1>

      <div className="flex gap-0 h-[calc(100vh-250px)] min-h-[400px] rounded-xl border border-[var(--color-border)] overflow-hidden">
        {/* 会話リスト */}
        <div className={`w-full md:w-80 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-card)] ${activeUser ? "hidden md:block" : ""}`}>
          {conversations.length > 0 ? (
            <div className="overflow-y-auto h-full">
              {conversations.map(conv => (
                <button
                  key={conv.user.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-[var(--color-muted)] transition-colors text-left ${activeUser === conv.user.id ? "bg-[var(--color-muted)]" : ""}`}
                >
                  {conv.user.avatarUrl ? (
                    <img src={conv.user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold shrink-0">
                      {conv.user.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{conv.user.name}</span>
                      <span className="text-xs text-[var(--color-muted-foreground)]">{formatRelativeTime(conv.lastAt)}</span>
                    </div>
                    <p className="text-xs text-[var(--color-muted-foreground)] truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="px-1.5 py-0.5 text-xs bg-[var(--color-primary)] text-white rounded-full">{conv.unread}</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-[var(--color-muted-foreground)]">
              メッセージはまだありません
            </div>
          )}
        </div>

        {/* メッセージエリア */}
        <div className={`flex-1 flex flex-col ${!activeUser ? "hidden md:flex" : "flex"}`}>
          {activeUser ? (
            <>
              {/* ヘッダー */}
              <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border)]">
                <button onClick={() => setActiveUser("")} className="md:hidden p-1 hover:bg-[var(--color-muted)] rounded">
                  <ArrowLeft size={20} />
                </button>
                <span className="font-medium">{activeUserName}</span>
              </div>

              {/* メッセージ一覧 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => {
                  const isMine = msg.sender.id === session?.user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        isMine
                          ? "bg-[var(--color-primary)] text-white"
                          : "bg-[var(--color-muted)]"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMine ? "text-white/60" : "text-[var(--color-muted-foreground)]"}`}>
                          {formatRelativeTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* 入力欄 */}
              <div className="p-4 border-t border-[var(--color-border)]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="メッセージを入力..."
                    className="flex-1 px-4 py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    className="p-2.5 rounded-full bg-[var(--color-primary)] text-white hover:opacity-90 disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-[var(--color-muted-foreground)]">
              会話を選択してください
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
