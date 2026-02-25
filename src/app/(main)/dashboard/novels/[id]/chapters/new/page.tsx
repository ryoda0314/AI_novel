"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { NovelEditor } from "@/components/novel/editor/novel-editor";

export default function NewChapterPage() {
  const params = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (mode: "publish" | "draft" | "schedule") => {
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("タイトルと本文は必須です");
      return;
    }

    if (mode === "schedule" && !scheduledAt) {
      setError("予約公開日時を設定してください");
      return;
    }

    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        content: content.trim(),
      };
      if (mode === "publish") {
        body.publish = true;
      } else if (mode === "schedule") {
        body.scheduledAt = new Date(scheduledAt).toISOString();
      }

      const res = await fetch(`/api/novels/${params.id}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "作成に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">新しい話を追加</h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">話のタイトル</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            placeholder="第○話のタイトル"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">本文</label>
          <NovelEditor value={content} onChange={setContent} />
        </div>

        {/* Schedule Option */}
        <div>
          <button
            type="button"
            onClick={() => setShowSchedule(!showSchedule)}
            className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <Clock size={14} />
            予約公開を設定
          </button>
          {showSchedule && (
            <div className="mt-2">
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleSubmit("publish")}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "保存中..." : "公開する"}
          </button>
          {showSchedule && scheduledAt && (
            <button
              onClick={() => handleSubmit("schedule")}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-amber-500 text-white font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              <Clock size={16} />
              予約公開
            </button>
          )}
          <button
            onClick={() => handleSubmit("draft")}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] disabled:opacity-50"
          >
            下書き保存
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)]"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
