"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { NovelCard } from "@/components/novels/novel-card";
import { Search } from "lucide-react";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-[var(--color-muted)] rounded-xl" />}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [novels, setNovels] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) {
      setNovels([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/novels?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(data => {
        setNovels(data.novels);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">検索結果</h1>
      {q && (
        <p className="text-[var(--color-muted-foreground)] mb-6">
          「{q}」の検索結果: {total}件
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-[var(--color-muted)] animate-pulse" />
          ))}
        </div>
      ) : novels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {novels.map(novel => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[var(--color-muted-foreground)]">
          <Search size={48} className="mx-auto mb-4 opacity-50" />
          <p>{q ? "作品が見つかりませんでした" : "検索キーワードを入力してください"}</p>
        </div>
      )}
    </div>
  );
}
