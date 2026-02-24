"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { NovelEditor } from "@/components/novel/editor/novel-editor";

export default function EditChapterPage() {
  const params = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id || !params.chapterId) return;

    fetch(`/api/novels/${params.id}/chapters/${params.chapterId}`)
      .then(r => r.json())
      .then(data => {
        setTitle(data.title);
        setContent(data.content);
        setIsPublished(!!data.publishedAt);
        setFetching(false);
      });
  }, [params.id, params.chapterId]);

  const handleSubmit = async (publish: boolean) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/novels/${params.id}/chapters/${params.chapterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, publish }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "更新に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="max-w-3xl mx-auto animate-pulse space-y-4">
      <div className="h-8 bg-[var(--color-muted)] rounded w-1/3" />
      <div className="h-10 bg-[var(--color-muted)] rounded" />
      <div className="h-64 bg-[var(--color-muted)] rounded" />
    </div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">話を編集</h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">タイトル</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
            {loading ? "保存中..." : isPublished ? "更新する" : "公開する"}
          </button>
          {!isPublished && (
            <button
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] disabled:opacity-50"
            >
              下書き保存
            </button>
          )}
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
