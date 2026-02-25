"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Award, Calendar, Users, Plus, X } from "lucide-react";
import { NovelCard } from "@/components/novels/novel-card";
import { formatDate } from "@/lib/utils";

interface ContestDetail {
  id: string;
  title: string;
  description: string;
  theme: string;
  startDate: string;
  endDate: string;
  status: string;
  entries: {
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    novel: any;
  }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface UserNovel { id: string; title: string; [key: string]: any; }

export default function ContestDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [contest, setContest] = useState<ContestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [userNovels, setUserNovels] = useState<UserNovel[]>([]);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [selectedNovel, setSelectedNovel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchContest = () => {
    if (!params.id) return;
    fetch(`/api/contests/${params.id}`)
      .then((r) => r.json())
      .then(setContest)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // 自分の作品一覧を取得（エントリーフォーム用）
  useEffect(() => {
    if (!session?.user?.id || !showEntryForm) return;
    fetch(`/api/novels?authorId=${session.user.id}`)
      .then((r) => r.json())
      .then((data) => setUserNovels(Array.isArray(data) ? data : data.novels || []));
  }, [session, showEntryForm]);

  const handleEntry = async () => {
    if (!selectedNovel || !params.id) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/contests/${params.id}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novelId: selectedNovel }),
      });
      if (res.ok) {
        setShowEntryForm(false);
        setSelectedNovel("");
        fetchContest();
      } else {
        const data = await res.json();
        alert(data.error || "エントリーに失敗しました");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveEntry = async (novelId: string) => {
    if (!confirm("エントリーを取り消しますか？")) return;
    const res = await fetch(`/api/contests/${params.id}/entries?novelId=${novelId}`, {
      method: "DELETE",
    });
    if (res.ok) fetchContest();
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-[var(--color-muted)] rounded w-2/3" />
        <div className="h-32 bg-[var(--color-muted)] rounded" />
      </div>
    );
  }

  if (!contest) {
    return <div className="text-center py-16">コンテストが見つかりませんでした</div>;
  }

  const isActive = contest.status === "active";
  const entryNovelIds = new Set(contest.entries.map((e) => e.novel.id));

  // エントリー可能な作品（まだエントリーしていないもの）
  const availableNovels = userNovels.filter((n) => !entryNovelIds.has(n.id));

  // 自分のエントリー
  const myEntries = contest.entries.filter(
    (e) => e.novel.author?.id === session?.user?.id
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] mb-3">
          <Link href="/contests" className="hover:text-[var(--color-primary)]">コンテスト</Link>
          <span>/</span>
        </div>

        <h1 className="text-2xl font-bold mb-3">{contest.title}</h1>

        <div className="flex items-center gap-3 mb-4">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isActive
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : contest.status === "upcoming"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}>
            {isActive ? "開催中" : contest.status === "upcoming" ? "開催予定" : "終了"}
          </span>
          <span className="flex items-center gap-1 text-sm text-[var(--color-muted-foreground)]">
            <Calendar size={14} />
            {formatDate(contest.startDate)} 〜 {formatDate(contest.endDate)}
          </span>
          <span className="flex items-center gap-1 text-sm text-[var(--color-muted-foreground)]">
            <Users size={14} />
            {contest.entries.length}作品
          </span>
        </div>

        {/* テーマ */}
        <div className="p-4 rounded-xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 mb-4">
          <p className="flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] mb-1">
            <Award size={16} /> お題テーマ
          </p>
          <p className="text-lg font-bold">「{contest.theme}」</p>
        </div>

        <p className="text-[var(--color-muted-foreground)] whitespace-pre-wrap">
          {contest.description}
        </p>
      </div>

      {/* エントリーボタン */}
      {isActive && session?.user && (
        <div className="mb-8">
          {!showEntryForm ? (
            <button
              onClick={() => setShowEntryForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90"
            >
              <Plus size={16} />
              作品をエントリーする
            </button>
          ) : (
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
              <h3 className="text-sm font-semibold mb-3">エントリーする作品を選択</h3>
              {availableNovels.length > 0 ? (
                <div className="space-y-3">
                  <select
                    value={selectedNovel}
                    onChange={(e) => setSelectedNovel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm"
                  >
                    <option value="">作品を選択...</option>
                    {availableNovels.map((n) => (
                      <option key={n.id} value={n.id}>{n.title}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleEntry}
                      disabled={!selectedNovel || submitting}
                      className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      {submitting ? "送信中..." : "エントリー"}
                    </button>
                    <button
                      onClick={() => setShowEntryForm(false)}
                      className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm hover:bg-[var(--color-muted)]"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  エントリー可能な作品がありません。{" "}
                  <Link href="/novels/new" className="text-[var(--color-primary)] hover:underline">
                    新しい作品を作成する
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 自分のエントリー */}
      {myEntries.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[var(--color-muted-foreground)] mb-3">
            あなたのエントリー
          </h2>
          <div className="space-y-3">
            {myEntries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <NovelCard novel={entry.novel} />
                </div>
                {isActive && (
                  <button
                    onClick={() => handleRemoveEntry(entry.novel.id)}
                    className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--color-muted-foreground)] hover:text-red-500 mt-2"
                    title="エントリー取消"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 全エントリー作品 */}
      <div>
        <h2 className="text-lg font-bold mb-4">参加作品 ({contest.entries.length})</h2>
        {contest.entries.length > 0 ? (
          <div className="space-y-4">
            {contest.entries.map((entry) => (
              <NovelCard key={entry.id} novel={entry.novel} />
            ))}
          </div>
        ) : (
          <p className="text-center py-12 text-[var(--color-muted-foreground)]">
            まだ参加作品はありません
          </p>
        )}
      </div>
    </div>
  );
}
