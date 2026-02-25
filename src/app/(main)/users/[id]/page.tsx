"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { NovelCard } from "@/components/novels/novel-card";
import { FollowButton } from "@/components/interactions/follow-button";
import { User, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface UserProfile {
  id: string;
  name: string;
  bio: string | null;
  createdAt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  novels: any[];
}

export default function UserProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/users/${params.id}`)
      .then(r => r.json())
      .then(setUser)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-[var(--color-muted)] rounded w-1/4" />
      <div className="h-4 bg-[var(--color-muted)] rounded w-1/2" />
    </div>;
  }

  if (!user) {
    return <div className="text-center py-16">ユーザーが見つかりませんでした</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Profile */}
      <div className="flex items-start gap-4 mb-8 p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-2xl font-bold">
          {user.name[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User size={20} /> {user.name}
          </h1>
          {user.bio && <p className="text-[var(--color-muted-foreground)] mt-1">{user.bio}</p>}
          <p className="text-xs text-[var(--color-muted-foreground)] mt-2 flex items-center gap-1">
            <Calendar size={12} /> {formatDate(user.createdAt)}に登録
          </p>
          {session?.user && session.user.id !== user.id && (
            <div className="mt-3">
              <FollowButton userId={user.id} showCounts />
            </div>
          )}
        </div>
      </div>

      {/* User's novels */}
      <h2 className="text-lg font-bold mb-4">投稿作品 ({user.novels.length})</h2>
      {user.novels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.novels.map(novel => (
            <NovelCard key={novel.id} novel={{ ...novel, author: { id: user.id, name: user.name } }} />
          ))}
        </div>
      ) : (
        <p className="text-center py-8 text-[var(--color-muted-foreground)]">
          まだ作品を投稿していません
        </p>
      )}
    </div>
  );
}
