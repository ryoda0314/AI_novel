"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Menu, X, BookOpen, PenTool, User, LogOut, LayoutDashboard, Bookmark } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/interactions/notification-bell";

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-[var(--color-primary)]">
            <BookOpen size={24} />
            <span className="hidden sm:inline">AI小説広場</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/novels" className="hover:text-[var(--color-primary)] transition-colors">
              小説一覧
            </Link>
            <Link href="/ranking" className="hover:text-[var(--color-primary)] transition-colors">
              ランキング
            </Link>
            <Link href="/contests" className="hover:text-[var(--color-primary)] transition-colors">
              コンテスト
            </Link>
            <Link href="/guide" className="hover:text-[var(--color-primary)] transition-colors">
              記法ガイド
            </Link>
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden sm:flex items-center">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="作品を検索..."
                className="w-48 lg:w-64 pl-9 pr-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            </div>
          </form>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />

            {session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-bold">
                    {session.user.name?.[0] || "U"}
                  </div>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg z-50">
                      <div className="p-3 border-b border-[var(--color-border)]">
                        <p className="font-medium text-sm">{session.user.name}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">{session.user.email}</p>
                      </div>
                      <div className="p-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-[var(--color-muted)] transition-colors"
                        >
                          <LayoutDashboard size={16} />
                          ダッシュボード
                        </Link>
                        <Link
                          href="/dashboard/bookshelf"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-[var(--color-muted)] transition-colors"
                        >
                          <Bookmark size={16} />
                          本棚
                        </Link>
                        <Link
                          href="/novels/new"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-[var(--color-muted)] transition-colors"
                        >
                          <PenTool size={16} />
                          新しい小説を書く
                        </Link>
                        <Link
                          href="/dashboard/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-[var(--color-muted)] transition-colors"
                        >
                          <User size={16} />
                          プロフィール
                        </Link>
                        <button
                          onClick={() => { setUserMenuOpen(false); signOut(); }}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-[var(--color-muted)] transition-colors w-full text-left text-red-500"
                        >
                          <LogOut size={16} />
                          ログアウト
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-1.5 text-sm rounded-lg hover:bg-[var(--color-muted)] transition-colors"
                >
                  ログイン
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 text-sm rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
                >
                  新規登録
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-[var(--color-muted)]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--color-border)] py-3">
            <form onSubmit={handleSearch} className="mb-3 sm:hidden">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="作品を検索..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
              </div>
            </form>
            <nav className="flex flex-col gap-1">
              <Link
                href="/novels"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded hover:bg-[var(--color-muted)] transition-colors"
              >
                小説一覧
              </Link>
              <Link
                href="/ranking"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded hover:bg-[var(--color-muted)] transition-colors"
              >
                ランキング
              </Link>
              <Link
                href="/contests"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded hover:bg-[var(--color-muted)] transition-colors"
              >
                コンテスト
              </Link>
              <Link
                href="/guide"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded hover:bg-[var(--color-muted)] transition-colors"
              >
                記法ガイド
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
