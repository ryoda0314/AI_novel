"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { NovelCard } from "@/components/novels/novel-card";
import { Trophy } from "lucide-react";

const tabs = [
  { key: "likes", label: "いいね数順" },
  { key: "views", label: "閲覧数順" },
  { key: "recent", label: "新着順" },
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

  const type = searchParams.get("type") || "likes";

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ranking?type=${type}`)
      .then(r => r.json())
      .then(setNovels)
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={28} className="text-yellow-500" />
        <h1 className="text-2xl font-bold">ランキング</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--color-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => router.push(`/ranking?type=${tab.key}`)}
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
              </div>
            </div>
          ))}
          {novels.length === 0 && (
            <p className="text-center py-16 text-[var(--color-muted-foreground)]">
              まだ作品がありません
            </p>
          )}
        </div>
      )}
    </div>
  );
}
