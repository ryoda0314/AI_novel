"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Eye, Heart, Bookmark, BarChart3, ChevronLeft } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { NovelInlineText } from "@/components/novel/novel-inline-text";

interface NovelSummary {
  id: string;
  title: string;
  viewCount: number;
  _count: { likes: number; bookmarks: number; chapters: number };
}

interface ChartDataPoint {
  date: string;
  views: number;
  likes: number;
  bookmarks: number;
}

interface AnalyticsData {
  novels: NovelSummary[];
  chartData: ChartDataPoint[];
  summary: { totalViews: number; totalLikes: number; totalBookmarks: number };
  period: { views: number; likes: number; bookmarks: number };
}

type MetricType = "views" | "likes" | "bookmarks";

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNovel, setSelectedNovel] = useState<string>("");
  const [days, setDays] = useState(30);
  const [metric, setMetric] = useState<MetricType>("views");

  useEffect(() => {
    if (!session?.user) return;
    setLoading(true);
    const params = new URLSearchParams({ days: String(days) });
    if (selectedNovel) params.set("novelId", selectedNovel);
    fetch(`/api/analytics?${params}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [session, selectedNovel, days]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-[var(--color-muted)] rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-[var(--color-muted)] rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-[var(--color-muted)] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxValue = Math.max(...data.chartData.map(d => d[metric]), 1);

  const metricConfig: Record<MetricType, { label: string; color: string; icon: typeof Eye }> = {
    views: { label: "閲覧数", color: "var(--color-primary)", icon: Eye },
    likes: { label: "いいね", color: "#ef4444", icon: Heart },
    bookmarks: { label: "ブックマーク", color: "#3b82f6", icon: Bookmark },
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="p-1 rounded-lg hover:bg-[var(--color-muted)]">
          <ChevronLeft size={20} />
        </Link>
        <BarChart3 size={24} className="text-[var(--color-primary)]" />
        <h1 className="text-2xl font-bold">アクセス解析</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          icon={<Eye size={20} />}
          label="総閲覧数"
          total={data.summary.totalViews}
          period={data.period.views}
          days={days}
          color="text-[var(--color-primary)]"
        />
        <SummaryCard
          icon={<Heart size={20} />}
          label="総いいね"
          total={data.summary.totalLikes}
          period={data.period.likes}
          days={days}
          color="text-red-500"
        />
        <SummaryCard
          icon={<Bookmark size={20} />}
          label="総ブックマーク"
          total={data.summary.totalBookmarks}
          period={data.period.bookmarks}
          days={days}
          color="text-blue-500"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={selectedNovel}
          onChange={(e) => setSelectedNovel(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm"
        >
          <option value="">全作品</option>
          {data.novels.map(n => (
            <option key={n.id} value={n.id}>{n.title}</option>
          ))}
        </select>

        <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-sm ${
                days === d
                  ? "bg-[var(--color-primary)] text-white"
                  : "hover:bg-[var(--color-muted)]"
              }`}
            >
              {d}日
            </button>
          ))}
        </div>

        <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden">
          {(["views", "likes", "bookmarks"] as MetricType[]).map(m => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1.5 text-sm ${
                metric === m
                  ? "bg-[var(--color-primary)] text-white"
                  : "hover:bg-[var(--color-muted)]"
              }`}
            >
              {metricConfig[m].label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] mb-6">
        <h2 className="text-sm font-medium mb-4 text-[var(--color-muted-foreground)]">
          {metricConfig[metric].label}の推移（過去{days}日）
        </h2>
        <div className="flex items-end gap-[2px] h-48">
          {data.chartData.map((point) => {
            const value = point[metric];
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
            return (
              <div
                key={point.date}
                className="flex-1 group relative"
                style={{ height: "100%" }}
              >
                <div className="absolute bottom-0 w-full flex flex-col items-center">
                  <div
                    className="w-full rounded-t-sm transition-all hover:opacity-80"
                    style={{
                      height: `${Math.max(height, value > 0 ? 2 : 0)}%`,
                      backgroundColor: metricConfig[metric].color,
                      minHeight: value > 0 ? "2px" : "0",
                    }}
                  />
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                  <div className="px-2 py-1 rounded bg-[var(--color-foreground)] text-[var(--color-background)] text-xs whitespace-nowrap">
                    {point.date.slice(5)}: {value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* X-axis labels */}
        <div className="flex mt-1">
          <span className="flex-1 text-[10px] text-[var(--color-muted-foreground)]">
            {data.chartData[0]?.date.slice(5)}
          </span>
          <span className="flex-1 text-[10px] text-[var(--color-muted-foreground)] text-right">
            {data.chartData[data.chartData.length - 1]?.date.slice(5)}
          </span>
        </div>
      </div>

      {/* Per-novel stats table */}
      {data.novels.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-muted)]">
                <th className="text-left px-4 py-3 font-medium">作品</th>
                <th className="text-right px-4 py-3 font-medium">話数</th>
                <th className="text-right px-4 py-3 font-medium">閲覧数</th>
                <th className="text-right px-4 py-3 font-medium">いいね</th>
                <th className="text-right px-4 py-3 font-medium">ブックマーク</th>
              </tr>
            </thead>
            <tbody>
              {data.novels.map((novel, i) => (
                <tr
                  key={novel.id}
                  className={i > 0 ? "border-t border-[var(--color-border)]" : ""}
                >
                  <td className="px-4 py-3">
                    <Link href={`/novels/${novel.id}`} className="hover:text-[var(--color-primary)]">
                      <NovelInlineText text={novel.title} />
                    </Link>
                  </td>
                  <td className="text-right px-4 py-3 text-[var(--color-muted-foreground)]">
                    {novel._count.chapters}
                  </td>
                  <td className="text-right px-4 py-3">{formatNumber(novel.viewCount)}</td>
                  <td className="text-right px-4 py-3">{formatNumber(novel._count.likes)}</td>
                  <td className="text-right px-4 py-3">{formatNumber(novel._count.bookmarks)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  total,
  period,
  days,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  total: number;
  period: number;
  days: number;
  color: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
      <div className={`flex items-center gap-2 mb-2 ${color}`}>
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">{formatNumber(total)}</p>
      <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
        過去{days}日: +{formatNumber(period)}
      </p>
    </div>
  );
}
