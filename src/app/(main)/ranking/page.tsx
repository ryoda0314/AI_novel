"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { NovelCard } from "@/components/novels/novel-card";
import { Trophy, Star } from "lucide-react";

const typeTabs = [
  { key: "votes", label: "いいね投票" },
  { key: "rating", label: "評価順" },
  { key: "views", label: "閲覧数順" },
  { key: "recent", label: "新着順" },
];

const periodTabs = [
  { key: "weekly", label: "週間" },
  { key: "monthly", label: "月間" },
  { key: "all", label: "総合" },
];

export default function RankingPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-[var(--color-muted)] rounded-xl" />}>
      <RankingContent />
    </Suspense>
  );
}

function RankingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [novels, setNovels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const type = searchParams.get("type") || "votes";
  const period = searchParams.get("period") || "weekly";

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ranking?type=${type}&period=${period}`)
      .then(r => r.json())
      .then(setNovels)
      .finally(() => setLoading(false));
  }, [type, period]);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => params.set(k, v));
    router.push(`/ranking?${params.toString()}`);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={28} className="text-yellow-500" />
        <h1 className="text-2xl font-bold">ランキング</h1>
      </div>

      {/* Type Tabs */}
      <div className="flex gap-1 mb-4 border-b border-[var(--color-border)]">
        {typeTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => updateParams({ type: tab.key })}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              type === tab.key
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Period Tabs (votes/views のみ) */}
      {(type === "votes" || type === "views") && (
        <div className="flex gap-1 mb-6">
          {periodTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => updateParams({ period: tab.key })}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                period === tab.key
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-border)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-[var(--color-muted)] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {novels.map((novel, index) => (
            <div key={novel.id} className="flex items-start gap-4">
              <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                index === 0 ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" :
                index === 1 ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" :
                index === 2 ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
                "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
              }`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <NovelCard novel={novel} />
                {/* 追加情報 */}
                {novel.periodLikes !== undefined && (
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-1 ml-1">
                    期間内いいね: {novel.periodLikes}
                  </p>
                )}
                {novel.averageRating !== undefined && (
                  <p className="flex items-center gap-1 text-xs text-amber-500 mt-1 ml-1">
                    <Star size={12} className="fill-amber-400" />
                    {novel.averageRating} ({novel._count?.reviews || 0}件のレビュー)
                  </p>
                )}
              </div>
            </div>
          ))}
          {novels.length === 0 && (
            <p className="text-center py-16 text-[var(--color-muted-foreground)]">
              {type === "rating" ? "レビューが3件以上の作品がまだありません" : "まだ作品がありません"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
