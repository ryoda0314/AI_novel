"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Upload,
  Edit,
  CheckSquare,
  Square,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Chapter {
  id: string;
  title: string;
  chapterNum: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function getChapterStatus(publishedAt: string | null) {
  if (!publishedAt) return { label: "下書き", color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" };
  const date = new Date(publishedAt);
  if (date > new Date()) return { label: "予約公開", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" };
  return { label: "公開済み", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" };
}

export default function ChapterManagementPage() {
  const params = useParams();
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");

  const fetchChapters = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/novels/${params.id}/chapters?includeDrafts=true`
      );
      if (res.ok) {
        const data = await res.json();
        setChapters(data);
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  const draftChapters = chapters.filter((ch) => !ch.publishedAt);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllDrafts = () => {
    if (selectedIds.length === draftChapters.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(draftChapters.map((ch) => ch.id));
    }
  };

  const handleBulkPublish = async () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(`${selectedIds.length}話を公開しますか？この操作は取り消せません。`)
    )
      return;

    setPublishing(true);
    setMessage("");

    try {
      const res = await fetch(
        `/api/novels/${params.id}/chapters/bulk-publish`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chapterIds: selectedIds }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setMessage(`${data.published}話を公開しました`);
        setSelectedIds([]);
        await fetchChapters();
      } else {
        const data = await res.json();
        setMessage(data.error || "公開に失敗しました");
      }
    } catch {
      setMessage("ネットワークエラーが発生しました");
    } finally {
      setPublishing(false);
    }
  };

  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (chapterId: string, title: string) => {
    if (!confirm(`「${title}」を削除しますか？この操作は取り消せません。`)) return;

    setDeleting(true);
    setMessage("");

    try {
      const res = await fetch(
        `/api/novels/${params.id}/chapters/${chapterId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setMessage("1話を削除しました");
        setSelectedIds((prev) => prev.filter((id) => id !== chapterId));
        await fetchChapters();
      } else {
        const data = await res.json();
        setMessage(data.error || "削除に失敗しました");
      }
    } catch {
      setMessage("ネットワークエラーが発生しました");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(`${selectedIds.length}話を削除しますか？この操作は取り消せません。`)
    )
      return;

    setDeleting(true);
    setMessage("");

    try {
      const results = await Promise.all(
        selectedIds.map((chapterId) =>
          fetch(`/api/novels/${params.id}/chapters/${chapterId}`, {
            method: "DELETE",
          })
        )
      );

      const deletedCount = results.filter((r) => r.ok).length;
      setMessage(`${deletedCount}話を削除しました`);
      setSelectedIds([]);
      await fetchChapters();
    } catch {
      setMessage("ネットワークエラーが発生しました");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mb-4"
      >
        <ArrowLeft size={14} />
        ダッシュボードへ戻る
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">章の管理</h1>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/novels/${params.id}/chapters/new`}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-sm"
          >
            <Plus size={14} />
            新しい話
          </Link>
          <Link
            href={`/dashboard/novels/${params.id}/chapters/bulk`}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 text-sm font-medium"
          >
            <Upload size={14} />
            一括投稿
          </Link>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm">
          {message}
        </div>
      )}

      {/* 下書き一括公開セクション */}
      {draftChapters.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">
                下書き {draftChapters.length}話
              </h2>
              {selectedIds.length > 0 && (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {selectedIds.length}話を選択中
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAllDrafts}
                className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-xs"
              >
                {selectedIds.length === draftChapters.length
                  ? "選択解除"
                  : "全選択"}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={selectedIds.length === 0 || deleting}
                className="px-4 py-1.5 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 text-xs"
              >
                {deleting ? "削除中..." : "選択した話を削除"}
              </button>
              <button
                onClick={handleBulkPublish}
                disabled={selectedIds.length === 0 || publishing}
                className="px-4 py-1.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50 text-xs"
              >
                {publishing ? "公開中..." : "選択した話を公開"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-[var(--color-muted)] animate-pulse"
            />
          ))}
        </div>
      ) : chapters.length > 0 ? (
        <div className="space-y-2">
          {chapters.map((chapter) => {
            const status = getChapterStatus(chapter.publishedAt);
            const isDraft = !chapter.publishedAt;

            return (
              <div
                key={chapter.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]"
              >
                {/* チェックボックス（下書きのみ） */}
                <button
                  onClick={() => isDraft && toggleSelect(chapter.id)}
                  className={`shrink-0 ${isDraft ? "cursor-pointer" : "invisible"}`}
                  disabled={!isDraft}
                >
                  {selectedIds.includes(chapter.id) ? (
                    <CheckSquare
                      size={18}
                      className="text-[var(--color-primary)]"
                    />
                  ) : (
                    <Square
                      size={18}
                      className="text-[var(--color-muted-foreground)]"
                    />
                  )}
                </button>

                {/* 話数 */}
                <span className="text-sm text-[var(--color-muted-foreground)] w-12 shrink-0">
                  第{chapter.chapterNum}話
                </span>

                {/* タイトル */}
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm truncate block">
                    {chapter.title}
                  </span>
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    {formatDate(chapter.updatedAt || chapter.createdAt)}
                  </span>
                </div>

                {/* ステータスバッジ */}
                <span
                  className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${status.color}`}
                >
                  {status.label}
                </span>

                {/* 編集リンク */}
                <Link
                  href={`/dashboard/novels/${params.id}/chapters/${chapter.id}/edit`}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                >
                  <Edit size={14} />
                </Link>

                {/* 削除ボタン */}
                <button
                  onClick={() => handleDelete(chapter.id, chapter.title)}
                  disabled={deleting}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--color-muted-foreground)] hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 border border-[var(--color-border)] rounded-xl">
          <p className="text-[var(--color-muted-foreground)] mb-4">
            まだ章がありません
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href={`/dashboard/novels/${params.id}/chapters/new`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90"
            >
              <Plus size={16} />
              最初の話を書く
            </Link>
            <Link
              href={`/dashboard/novels/${params.id}/chapters/bulk`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)]"
            >
              <Upload size={16} />
              一括投稿
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
