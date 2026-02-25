"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, Trash2, GripVertical, ChevronLeft, Library, BookOpen } from "lucide-react";
import { NovelInlineText } from "@/components/novel/novel-inline-text";

interface NovelItem {
  id: string;
  title: string;
  seriesOrder: number | null;
  viewCount: number;
  status: string;
  _count: { chapters: number; likes: number };
}

interface Series {
  id: string;
  title: string;
  description: string | null;
  novels: NovelItem[];
}

interface UnassignedNovel {
  id: string;
  title: string;
}

export default function SeriesManagementPage() {
  const { data: session } = useSession();
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [unassigned, setUnassigned] = useState<UnassignedNovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    if (!session?.user?.id) return;

    const [seriesRes, userRes] = await Promise.all([
      fetch(`/api/series?authorId=${session.user.id}`),
      fetch(`/api/users/${session.user.id}`),
    ]);
    const [series, userData] = await Promise.all([seriesRes.json(), userRes.json()]);

    setSeriesList(series);

    // シリーズ未所属の作品を取得
    const assignedIds = new Set(
      series.flatMap((s: Series) => s.novels.map((n: NovelItem) => n.id))
    );
    const unassignedNovels = (userData.novels || []).filter(
      (n: UnassignedNovel) => !assignedIds.has(n.id)
    );
    setUnassigned(unassignedNovels);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [session?.user?.id]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    const res = await fetch("/api/series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), description: newDescription.trim() }),
    });
    if (res.ok) {
      setNewTitle("");
      setNewDescription("");
      setShowCreate(false);
      fetchData();
    }
    setCreating(false);
  };

  const handleDelete = async (seriesId: string, title: string) => {
    if (!confirm(`シリーズ「${title}」を削除しますか？\n※ 作品は削除されません`)) return;
    const res = await fetch(`/api/series/${seriesId}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  const handleAddNovel = async (seriesId: string, novelId: string) => {
    const series = seriesList.find(s => s.id === seriesId);
    if (!series) return;
    const novelIds = [...series.novels.map(n => n.id), novelId];
    await fetch(`/api/series/${seriesId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ novelIds }),
    });
    fetchData();
  };

  const handleRemoveNovel = async (seriesId: string, novelId: string) => {
    const series = seriesList.find(s => s.id === seriesId);
    if (!series) return;
    const novelIds = series.novels.filter(n => n.id !== novelId).map(n => n.id);
    await fetch(`/api/series/${seriesId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ novelIds }),
    });
    fetchData();
  };

  const handleMoveNovel = async (seriesId: string, novelId: string, direction: "up" | "down") => {
    const series = seriesList.find(s => s.id === seriesId);
    if (!series) return;
    const ids = series.novels.map(n => n.id);
    const idx = ids.indexOf(novelId);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= ids.length) return;
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
    await fetch(`/api/series/${seriesId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ novelIds: ids }),
    });
    fetchData();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-[var(--color-muted)] rounded w-1/3" />
        <div className="h-32 bg-[var(--color-muted)] rounded-xl" />
        <div className="h-32 bg-[var(--color-muted)] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-1 rounded-lg hover:bg-[var(--color-muted)]">
            <ChevronLeft size={20} />
          </Link>
          <Library size={24} className="text-[var(--color-primary)]" />
          <h1 className="text-2xl font-bold">シリーズ管理</h1>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 text-sm font-medium"
        >
          <Plus size={16} />
          新しいシリーズ
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
          <h3 className="font-medium mb-3">シリーズを作成</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="シリーズ名"
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="説明（任意）"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={creating || !newTitle.trim()}
                className="px-4 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-sm hover:opacity-90 disabled:opacity-50"
              >
                {creating ? "作成中..." : "作成"}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-1.5 rounded-lg border border-[var(--color-border)] text-sm hover:bg-[var(--color-muted)]"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Series List */}
      {seriesList.length > 0 ? (
        <div className="space-y-4">
          {seriesList.map(series => (
            <div
              key={series.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden"
            >
              {/* Series Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                <div>
                  <Link
                    href={`/series/${series.id}`}
                    className="font-bold hover:text-[var(--color-primary)]"
                  >
                    {series.title}
                  </Link>
                  {series.description && (
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                      {series.description}
                    </p>
                  )}
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                    {series.novels.length}作品
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(series.id, series.title)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--color-muted-foreground)] hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Novels in Series */}
              <div className="divide-y divide-[var(--color-border)]">
                {series.novels.map((novel, idx) => (
                  <div key={novel.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMoveNovel(series.id, novel.id, "up")}
                        disabled={idx === 0}
                        className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] disabled:opacity-30"
                      >
                        <GripVertical size={12} className="rotate-180" />
                      </button>
                      <button
                        onClick={() => handleMoveNovel(series.id, novel.id, "down")}
                        disabled={idx === series.novels.length - 1}
                        className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] disabled:opacity-30"
                      >
                        <GripVertical size={12} />
                      </button>
                    </div>
                    <span className="text-xs text-[var(--color-muted-foreground)] w-6 text-center">
                      {idx + 1}
                    </span>
                    <Link
                      href={`/novels/${novel.id}`}
                      className="flex-1 text-sm hover:text-[var(--color-primary)] truncate"
                    >
                      <NovelInlineText text={novel.title} />
                    </Link>
                    <button
                      onClick={() => handleRemoveNovel(series.id, novel.id)}
                      className="text-xs text-[var(--color-muted-foreground)] hover:text-red-500"
                    >
                      除外
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Novel */}
              {unassigned.length > 0 && (
                <div className="px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-muted)]/30">
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleAddNovel(series.id, e.target.value);
                      e.target.value = "";
                    }}
                    className="text-xs px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-background)]"
                    defaultValue=""
                  >
                    <option value="" disabled>作品を追加...</option>
                    {unassigned.map(n => (
                      <option key={n.id} value={n.id}>{n.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : !showCreate ? (
        <div className="text-center py-16 border border-[var(--color-border)] rounded-xl">
          <BookOpen size={48} className="mx-auto mb-4 text-[var(--color-muted-foreground)] opacity-50" />
          <p className="text-[var(--color-muted-foreground)] mb-4">まだシリーズがありません</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90"
          >
            <Plus size={16} />
            最初のシリーズを作成
          </button>
        </div>
      ) : null}
    </div>
  );
}
