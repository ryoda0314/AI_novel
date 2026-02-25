"use client";

import { Bookmark } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface BookmarkButtonProps {
  novelId: string;
  initialBookmarked: boolean;
  initialCount: number;
}

export function BookmarkButton({ novelId, initialBookmarked, initialCount }: BookmarkButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleBookmark = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setBookmarked(!bookmarked);
    setCount(bookmarked ? count - 1 : count + 1);

    try {
      const res = await fetch(`/api/novels/${novelId}/bookmark`, { method: "POST" });
      const data = await res.json();
      setBookmarked(data.bookmarked);
      setCount(data.count);
    } catch {
      setBookmarked(bookmarked);
      setCount(count);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBookmark}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
        bookmarked
          ? "border-blue-300 bg-blue-50 text-blue-500 dark:border-blue-800 dark:bg-blue-900/20"
          : "border-[var(--color-border)] hover:border-blue-300 hover:text-blue-500"
      }`}
    >
      <Bookmark size={18} className={bookmarked ? "fill-current" : ""} />
      <span className="text-sm font-medium">{count}</span>
    </button>
  );
}
