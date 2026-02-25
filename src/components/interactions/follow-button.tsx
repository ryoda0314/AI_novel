"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserCheck } from "lucide-react";

interface FollowButtonProps {
  userId: string;
  showCounts?: boolean;
}

export function FollowButton({ userId, showCounts = false }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${userId}/follow`)
      .then((r) => r.json())
      .then((data) => {
        setIsFollowing(data.isFollowing);
        setFollowerCount(data.followerCount);
      });
  }, [userId]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
        setFollowerCount((prev) => prev + (data.isFollowing ? 1 : -1));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
          isFollowing
            ? "border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-900/20"
            : "bg-[var(--color-primary)] text-white hover:opacity-90"
        }`}
      >
        {isFollowing ? (
          <>
            <UserCheck size={14} />
            フォロー中
          </>
        ) : (
          <>
            <UserPlus size={14} />
            フォロー
          </>
        )}
      </button>
      {showCounts && (
        <span className="text-xs text-[var(--color-muted-foreground)]">
          {followerCount}フォロワー
        </span>
      )}
    </div>
  );
}
