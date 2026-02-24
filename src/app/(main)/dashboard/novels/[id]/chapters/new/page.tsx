"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { NovelEditor } from "@/components/novel/editor/novel-editor";

export default function NewChapterPage() {
  const params = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (publish: boolean) => {
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("タイトルと本文は必須です");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/novels/${params.id}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          publish,
        }),
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

        <div className="flex gap-3">
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "保存中..." : "公開する"}
          </button>
          <button
            onClick={() => handleSubmit(false)}
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
