"use client";

import { useState, useEffect } from "react";
import { NovelCard } from "@/components/novels/novel-card";
import { Bookmark } from "lucide-react";

export default function BookshelfPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [novels, setNovels] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/bookmarks?page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setNovels(data.novels || []);
        setTotalPages(data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">本棚</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] animate-pulse"
            />
          ))}
        </div>
      ) : novels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {novels.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[var(--color-muted-foreground)]">
          <Bookmark size={48} className="mx-auto mb-4 opacity-50" />
          <p>まだブックマークがありません</p>
          <p className="text-sm mt-1">気になる作品をブックマークして、ここから読み返しましょう</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <button
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-sm"
            >
              前へ
            </button>
          )}
          <span className="px-4 py-2 text-sm">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <button
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-sm"
            >
              次へ
            </button>
          )}
        </div>
      )}
    </div>
  );
}
