"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, Edit, Trash2, Heart, Eye, BookOpen, BarChart3, Library } from "lucide-react";
import { getStatusLabel, getStatusColor, formatDate } from "@/lib/utils";
import { NovelInlineText } from "@/components/novel/novel-inline-text";

interface Novel {
  id: string;
  title: string;
  status: string;
  viewCount: number;
  createdAt: string;
  _count: { likes: number; chapters: number };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/users/${session.user.id}`)
      .then(r => r.json())
      .then(data => setNovels(data.novels || []))
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  const handleDelete = async (novelId: string, title: string) => {
    if (!confirm(`「${title}」を削除しますか？この操作は取り消せません。`)) return;

    const res = await fetch(`/api/novels/${novelId}`, { method: "DELETE" });
    if (res.ok) {
      setNovels(novels.filter(n => n.id !== novelId));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">マイ作品</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/series"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors text-sm"
          >
            <Library size={16} />
            シリーズ
          </Link>
          <Link
            href="/dashboard/analytics"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors text-sm"
          >
            <BarChart3 size={16} />
            アクセス解析
          </Link>
          <Link
            href="/novels/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity text-sm font-medium"
          >
            <Plus size={16} />
            新しい小説を作成
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-[var(--color-muted)] animate-pulse" />
          ))}
        </div>
      ) : novels.length > 0 ? (
        <div className="space-y-3">
          {novels.map(novel => (
            <div
              key={novel.id}
              className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/novels/${novel.id}`} className="font-bold hover:text-[var(--color-primary)] truncate">
                    <NovelInlineText text={novel.title} />
                  </Link>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${getStatusColor(novel.status)}`}>
                    {getStatusLabel(novel.status)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[var(--color-muted-foreground)]">
                  <span className="flex items-center gap-1"><Heart size={12} /> {novel._count.likes}</span>
                  <span className="flex items-center gap-1"><Eye size={12} /> {novel.viewCount}</span>
                  <span className="flex items-center gap-1"><BookOpen size={12} /> {novel._count.chapters}話</span>
                  <span>{formatDate(novel.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Link
                  href={`/dashboard/novels/${novel.id}/chapters/new`}
                  className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-xs"
                >
                  新しい話
                </Link>
                <Link
                  href={`/dashboard/novels/${novel.id}/edit`}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                >
                  <Edit size={16} />
                </Link>
                <button
                  onClick={() => handleDelete(novel.id, novel.title)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--color-muted-foreground)] hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-[var(--color-border)] rounded-xl">
          <BookOpen size={48} className="mx-auto mb-4 text-[var(--color-muted-foreground)] opacity-50" />
          <p className="text-[var(--color-muted-foreground)] mb-4">まだ作品がありません</p>
          <Link
            href="/novels/new"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90"
          >
            <Plus size={16} />
            最初の小説を書く
          </Link>
        </div>
      )}
    </div>
  );
}
