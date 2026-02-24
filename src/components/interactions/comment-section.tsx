"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Trash2, MessageCircle } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
}

export function CommentSection({ novelId }: { novelId: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchComments();
  }, [novelId]);

  const fetchComments = async () => {
    const res = await fetch(`/api/novels/${novelId}/comments`);
    const data = await res.json();
    setComments(data.comments);
    setTotal(data.total);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/novels/${novelId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments([comment, ...comments]);
        setTotal(total + 1);
        setContent("");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("コメントを削除しますか？")) return;

    const res = await fetch(`/api/novels/${novelId}/comments/${commentId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setComments(comments.filter((c) => c.id !== commentId));
      setTotal(total - 1);
    }
  };

  return (
    <div>
      <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
        <MessageCircle size={20} />
        コメント ({total})
      </h3>

      {session ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="コメントを書く..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="px-4 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "送信中..." : "コメントする"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mb-6 text-sm text-[var(--color-muted-foreground)]">
          <Link href="/login" className="text-[var(--color-primary)] hover:underline">
            ログイン
          </Link>
          してコメントする
        </p>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-bold">
                  {comment.user.name[0]}
                </div>
                <Link href={`/users/${comment.user.id}`} className="text-sm font-medium hover:text-[var(--color-primary)]">
                  {comment.user.name}
                </Link>
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {formatRelativeTime(comment.createdAt)}
                </span>
              </div>
              {session?.user?.id === comment.user.id && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-[var(--color-muted-foreground)] hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-center text-[var(--color-muted-foreground)] py-8">
            まだコメントはありません
          </p>
        )}
      </div>
    </div>
  );
}
