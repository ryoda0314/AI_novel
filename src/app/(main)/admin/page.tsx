"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Users, BookOpen, MessageSquare, Flag, AlertTriangle, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Stats {
  userCount: number;
  novelCount: number;
  chapterCount: number;
  commentCount: number;
  reportCount: number;
  newUsersWeek: number;
  newNovelsWeek: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { novels: number; comments: number };
}

interface Report {
  id: string;
  reason: string;
  detail: string | null;
  status: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  user: { id: string; name: string };
}

type Tab = "overview" | "users" | "reports" | "contests";

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportPage, setReportPage] = useState(1);
  const [reportTotal, setReportTotal] = useState(0);
  const [reportFilter, setReportFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // コンテスト作成フォーム
  const [contestForm, setContestForm] = useState({ title: "", description: "", theme: "", startDate: "", endDate: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => {
        if (r.status === 403) { setError("管理者権限がありません"); return null; }
        return r.json();
      })
      .then(data => { if (data) setStats(data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "users") {
      fetch(`/api/admin/users?page=${userPage}`)
        .then(r => r.json())
        .then(data => { setUsers(data.users || []); setUserTotal(data.totalPages || 1); });
    }
  }, [tab, userPage]);

  useEffect(() => {
    if (tab === "reports") {
      fetch(`/api/admin/reports?status=${reportFilter}&page=${reportPage}`)
        .then(r => r.json())
        .then(data => { setReports(data.reports || []); setReportTotal(data.totalPages || 1); });
    }
  }, [tab, reportFilter, reportPage]);

  const handleReportStatus = async (id: string, status: string) => {
    await fetch("/api/admin/reports", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const handleCreateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/admin/contests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contestForm),
    });
    if (res.ok) {
      setContestForm({ title: "", description: "", theme: "", startDate: "", endDate: "" });
      router.push("/contests");
    }
    setCreating(false);
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto animate-pulse space-y-4">
      <div className="h-8 bg-[var(--color-muted)] rounded w-1/3" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-[var(--color-muted)] rounded-xl" />)}</div>
    </div>;
  }

  if (error) {
    return <div className="max-w-5xl mx-auto text-center py-16">
      <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
      <h1 className="text-xl font-bold mb-2">{error}</h1>
      <button onClick={() => router.push("/")} className="text-[var(--color-primary)] hover:underline">ホームに戻る</button>
    </div>;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "概要" },
    { id: "users", label: "ユーザー" },
    { id: "reports", label: "通報" },
    { id: "contests", label: "コンテスト作成" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">管理者ダッシュボード</h1>

      {/* タブ */}
      <div className="flex gap-1 mb-6 border-b border-[var(--color-border)]">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            }`}
          >
            {t.label}
            {t.id === "reports" && stats && stats.reportCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">{stats.reportCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* 概要 */}
      {tab === "overview" && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "ユーザー数", value: stats.userCount, icon: Users, color: "text-blue-500" },
              { label: "作品数", value: stats.novelCount, icon: BookOpen, color: "text-green-500" },
              { label: "コメント数", value: stats.commentCount, icon: MessageSquare, color: "text-purple-500" },
              { label: "未対応通報", value: stats.reportCount, icon: Flag, color: "text-red-500" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
                <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] mb-1">
                  <Icon size={16} className={color} /> {label}
                </div>
                <p className="text-2xl font-bold">{value.toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
              <p className="text-sm text-[var(--color-muted-foreground)] mb-1">今週の新規ユーザー</p>
              <p className="text-xl font-bold">+{stats.newUsersWeek}</p>
            </div>
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
              <p className="text-sm text-[var(--color-muted-foreground)] mb-1">今週の新規作品</p>
              <p className="text-xl font-bold">+{stats.newNovelsWeek}</p>
            </div>
          </div>
        </div>
      )}

      {/* ユーザー一覧 */}
      {tab === "users" && (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-3 px-2">名前</th>
                  <th className="text-left py-3 px-2">メール</th>
                  <th className="text-left py-3 px-2">権限</th>
                  <th className="text-left py-3 px-2">作品数</th>
                  <th className="text-left py-3 px-2">登録日</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-muted)]">
                    <td className="py-2 px-2 font-medium">{u.name}</td>
                    <td className="py-2 px-2 text-[var(--color-muted-foreground)]">{u.email}</td>
                    <td className="py-2 px-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2 px-2">{u._count.novels}</td>
                    <td className="py-2 px-2 text-[var(--color-muted-foreground)]">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {userTotal > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1} className="p-2 rounded hover:bg-[var(--color-muted)] disabled:opacity-30"><ChevronLeft size={16} /></button>
              <span className="text-sm">{userPage} / {userTotal}</span>
              <button onClick={() => setUserPage(p => Math.min(userTotal, p + 1))} disabled={userPage === userTotal} className="p-2 rounded hover:bg-[var(--color-muted)] disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          )}
        </div>
      )}

      {/* 通報一覧 */}
      {tab === "reports" && (
        <div>
          <div className="flex gap-2 mb-4">
            {["pending", "reviewed", "resolved", "all"].map(s => (
              <button key={s} onClick={() => { setReportFilter(s); setReportPage(1); }}
                className={`px-3 py-1.5 text-sm rounded-lg ${reportFilter === s ? "bg-[var(--color-primary)] text-white" : "border border-[var(--color-border)] hover:bg-[var(--color-muted)]"}`}>
                {s === "pending" ? "未対応" : s === "reviewed" ? "確認済み" : s === "resolved" ? "解決済み" : "すべて"}
              </button>
            ))}
          </div>
          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map(r => (
                <div key={r.id} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{r.reason}</p>
                      {r.detail && <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{r.detail}</p>}
                      <div className="flex items-center gap-3 text-xs text-[var(--color-muted-foreground)] mt-2">
                        <span>通報者: {r.user.name}</span>
                        <span>対象: {r.targetType}</span>
                        <span>{formatDate(r.createdAt)}</span>
                      </div>
                    </div>
                    {r.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleReportStatus(r.id, "reviewed")} className="px-3 py-1 text-xs rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)]">確認</button>
                        <button onClick={() => handleReportStatus(r.id, "resolved")} className="px-3 py-1 text-xs rounded-lg bg-green-500 text-white hover:bg-green-600">解決</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-[var(--color-muted-foreground)]">通報はありません</p>
          )}
        </div>
      )}

      {/* コンテスト作成 */}
      {tab === "contests" && (
        <form onSubmit={handleCreateContest} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium mb-1">タイトル</label>
            <input type="text" value={contestForm.title} onChange={e => setContestForm(f => ({ ...f, title: e.target.value }))} required
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">お題テーマ</label>
            <input type="text" value={contestForm.theme} onChange={e => setContestForm(f => ({ ...f, theme: e.target.value }))} required
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">説明</label>
            <textarea value={contestForm.description} onChange={e => setContestForm(f => ({ ...f, description: e.target.value }))} required rows={4}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">開始日</label>
              <input type="date" value={contestForm.startDate} onChange={e => setContestForm(f => ({ ...f, startDate: e.target.value }))} required
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">終了日</label>
              <input type="date" value={contestForm.endDate} onChange={e => setContestForm(f => ({ ...f, endDate: e.target.value }))} required
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]" />
            </div>
          </div>
          <button type="submit" disabled={creating}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50">
            <Plus size={16} /> {creating ? "作成中..." : "コンテストを作成"}
          </button>
        </form>
      )}
    </div>
  );
}
