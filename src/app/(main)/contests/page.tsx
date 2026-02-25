"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Award, Calendar, Users, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Contest {
  id: string;
  title: string;
  description: string;
  theme: string;
  startDate: string;
  endDate: string;
  status: string;
  _count: { entries: number };
}

const statusLabels: Record<string, { text: string; color: string }> = {
  active: { text: "開催中", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  upcoming: { text: "開催予定", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  ended: { text: "終了", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/contests")
      .then((r) => r.json())
      .then(setContests)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-[var(--color-muted)] rounded w-1/3 animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-[var(--color-muted)] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Award size={28} className="text-[var(--color-primary)]" />
        <h1 className="text-2xl font-bold">コンテスト・お題</h1>
      </div>

      <p className="text-[var(--color-muted-foreground)] mb-8">
        テーマに沿った作品を投稿して参加しよう。開催中のコンテストにあなたの作品をエントリーできます。
      </p>

      {contests.length > 0 ? (
        <div className="space-y-4">
          {contests.map((contest) => {
            const status = statusLabels[contest.status] || statusLabels.ended;
            return (
              <Link
                key={contest.id}
                href={`/contests/${contest.id}`}
                className="block p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary)]/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold">{contest.title}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-muted-foreground)] line-clamp-2">
                      {contest.description}
                    </p>
                  </div>
                  <ChevronRight size={20} className="shrink-0 text-[var(--color-muted-foreground)]" />
                </div>

                <div className="flex items-center gap-4 text-xs text-[var(--color-muted-foreground)]">
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium">
                    <Award size={12} />
                    お題: {contest.theme}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(contest.startDate)} 〜 {formatDate(contest.endDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {contest._count.entries}作品
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-center py-16 text-[var(--color-muted-foreground)]">
          現在開催中のコンテストはありません
        </p>
      )}
    </div>
  );
}
