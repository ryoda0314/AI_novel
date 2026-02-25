"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, Link2, Link2Off, Check, Copy } from "lucide-react";
import { NovelEditor } from "@/components/novel/editor/novel-editor";

type ChapterStatus = "draft" | "published" | "scheduled";

function getChapterStatus(publishedAt: string | null): ChapterStatus {
  if (!publishedAt) return "draft";
  return new Date(publishedAt) > new Date() ? "scheduled" : "published";
}

function formatLocalDatetime(date: string): string {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function EditChapterPage() {
  const params = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<ChapterStatus>("draft");
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const [previewCopied, setPreviewCopied] = useState(false);
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
        const chapterStatus = getChapterStatus(data.publishedAt);
        setStatus(chapterStatus);
        if (chapterStatus === "scheduled") {
          setShowSchedule(true);
          setScheduledAt(formatLocalDatetime(data.publishedAt));
        }
        setPreviewToken(data.previewToken || null);
        setFetching(false);
      });
  }, [params.id, params.chapterId]);

  const handleSubmit = async (mode: "publish" | "draft" | "schedule") => {
    setError("");

    if (mode === "schedule" && !scheduledAt) {
      setError("予約公開日時を設定してください");
      return;
    }

    setLoading(true);

    try {
      const body: Record<string, unknown> = { title, content };
      if (mode === "publish") {
        body.publish = true;
        body.scheduledAt = undefined;
      } else if (mode === "schedule") {
        body.scheduledAt = new Date(scheduledAt).toISOString();
      } else {
        body.publish = false;
        body.scheduledAt = null;
      }

      const res = await fetch(`/api/novels/${params.id}/chapters/${params.chapterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">話を編集</h1>
        {status === "scheduled" && (
          <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            予約公開
          </span>
        )}
        {status === "draft" && (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
            下書き
          </span>
        )}
      </div>

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

        {/* Schedule Option */}
        {status !== "published" && (
          <div>
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              <Clock size={14} />
              {showSchedule ? "予約公開を取り消す" : "予約公開を設定"}
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
        )}

        {/* Preview Link */}
        {status !== "published" && (
          <PreviewLinkSection
            chapterId={params.chapterId as string}
            token={previewToken}
            onTokenChange={setPreviewToken}
            copied={previewCopied}
            onCopied={setPreviewCopied}
          />
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleSubmit("publish")}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "保存中..." : status === "published" ? "更新する" : "公開する"}
          </button>
          {status !== "published" && showSchedule && scheduledAt && (
            <button
              onClick={() => handleSubmit("schedule")}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-amber-500 text-white font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              <Clock size={16} />
              予約公開
            </button>
          )}
          {status !== "published" && (
            <button
              onClick={() => handleSubmit("draft")}
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

function PreviewLinkSection({
  chapterId,
  token,
  onTokenChange,
  copied,
  onCopied,
}: {
  chapterId: string;
  token: string | null;
  onTokenChange: (token: string | null) => void;
  copied: boolean;
  onCopied: (v: boolean) => void;
}) {
  const [generating, setGenerating] = useState(false);

  const generateLink = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId }),
      });
      if (res.ok) {
        const data = await res.json();
        onTokenChange(data.token);
      }
    } finally {
      setGenerating(false);
    }
  };

  const revokeLink = async () => {
    const res = await fetch(`/api/preview?chapterId=${chapterId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      onTokenChange(null);
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/preview?token=${token}`;
    navigator.clipboard.writeText(url);
    onCopied(true);
    setTimeout(() => onCopied(false), 2000);
  };

  if (!token) {
    return (
      <div>
        <button
          type="button"
          onClick={generateLink}
          disabled={generating}
          className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          <Link2 size={14} />
          {generating ? "生成中..." : "プレビューリンクを生成"}
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/30">
      <div className="flex items-center gap-2 mb-2">
        <Link2 size={14} className="text-[var(--color-primary)]" />
        <span className="text-sm font-medium">プレビューリンク</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={`${typeof window !== "undefined" ? window.location.origin : ""}/preview?token=${token}`}
          className="flex-1 px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-background)] text-xs font-mono"
        />
        <button
          onClick={copyLink}
          className="p-1.5 rounded hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
          title="コピー"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
        <button
          onClick={revokeLink}
          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--color-muted-foreground)] hover:text-red-500"
          title="リンクを無効化"
        >
          <Link2Off size={14} />
        </button>
      </div>
      <p className="text-[10px] text-[var(--color-muted-foreground)] mt-1">
        このリンクを知っている人は誰でもこの話を閲覧できます
      </p>
    </div>
  );
}
