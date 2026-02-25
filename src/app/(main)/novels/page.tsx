"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { NovelCard } from "@/components/novels/novel-card";
import { Search, X, Loader2 } from "lucide-react";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

export default function NovelsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-[var(--color-muted)] rounded-xl" />}>
      <NovelsContent />
    </Suspense>
  );
}

function NovelsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [novels, setNovels] = useState<any[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const sort = searchParams.get("sort") || "recent";
  const genre = searchParams.get("genre") || "";
  const tag = searchParams.get("tag") || "";
  const q = searchParams.get("q") || "";

  useEffect(() => {
    fetch("/api/genres").then(r => r.json()).then(setGenres);
  }, []);

  // フィルター変更時にリセット
  useEffect(() => {
    setNovels([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
  }, [sort, genre, tag, q]);

  // データ取得
  const fetchNovels = useCallback(async (pageNum: number, isInitial: boolean) => {
    const params = new URLSearchParams();
    params.set("page", pageNum.toString());
    params.set("limit", "18");
    params.set("sort", sort);
    if (genre) params.set("genre", genre);
    if (tag) params.set("tag", tag);
    if (q) params.set("q", q);

    const res = await fetch(`/api/novels?${params}`);
    const data = await res.json();

    if (isInitial) {
      setNovels(data.novels || []);
    } else {
      setNovels(prev => [...prev, ...(data.novels || [])]);
    }

    setHasMore(pageNum < (data.totalPages || 1));
    setLoading(false);
    setLoadingMore(false);
  }, [sort, genre, tag, q]);

  useEffect(() => {
    fetchNovels(1, true);
  }, [fetchNovels]);

  // Intersection Observer で無限スクロール
  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setLoadingMore(true);
          const nextPage = page + 1;
          setPage(nextPage);
          fetchNovels(nextPage, false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, fetchNovels]);

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/novels?${params}`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">小説一覧</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={sort}
          onChange={(e) => updateParams("sort", e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-sm"
        >
          <option value="recent">新着順</option>
          <option value="likes">いいね順</option>
          <option value="views">閲覧数順</option>
        </select>

        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => updateParams("genre", "")}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              !genre ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-muted)] hover:bg-[var(--color-border)]"
            }`}
          >
            すべて
          </button>
          {genres.map((g) => (
            <button
              key={g.slug}
              onClick={() => updateParams("genre", g.slug)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                genre === g.slug ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-muted)] hover:bg-[var(--color-border)]"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Active tag filter */}
      {tag && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-[var(--color-muted-foreground)]">タグ:</span>
          <span className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full border border-[var(--color-primary)]/30 text-[var(--color-primary)]">
            #{tag}
            <button onClick={() => updateParams("tag", "")} className="hover:text-red-500 transition-colors">
              <X size={14} />
            </button>
          </span>
        </div>
      )}

      {/* Novel Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] animate-pulse" />
          ))}
        </div>
      ) : novels.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {novels.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>

          {/* 無限スクロールトリガー */}
          {hasMore && (
            <div ref={observerRef} className="flex justify-center py-8">
              {loadingMore && <Loader2 size={24} className="animate-spin text-[var(--color-muted-foreground)]" />}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-[var(--color-muted-foreground)]">
          <Search size={48} className="mx-auto mb-4 opacity-50" />
          <p>作品が見つかりませんでした</p>
        </div>
      )}
    </div>
  );
}
