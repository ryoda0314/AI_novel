"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
  novelId: string;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({ novelId, initialLiked, initialCount }: LikeButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);
    // Optimistic update
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);

    try {
      const res = await fetch(`/api/novels/${novelId}/like`, { method: "POST" });
      const data = await res.json();
      setLiked(data.liked);
      setCount(data.count);
    } catch {
      // Revert on error
      setLiked(liked);
      setCount(count);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
        liked
          ? "border-red-300 bg-red-50 text-red-500 dark:border-red-800 dark:bg-red-900/20"
          : "border-[var(--color-border)] hover:border-red-300 hover:text-red-500"
      }`}
    >
      <Heart size={18} className={liked ? "fill-current" : ""} />
      <span className="text-sm font-medium">{count}</span>
    </button>
  );
}
