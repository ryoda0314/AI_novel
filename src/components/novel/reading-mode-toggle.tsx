"use client";

import { useState, useEffect } from "react";
import { AlignLeft, AlignJustify } from "lucide-react";

type ReadingMode = "horizontal" | "vertical";

const STORAGE_KEY = "novel-reading-mode";

export function ReadingModeToggle({
  onChange,
}: {
  onChange: (mode: ReadingMode) => void;
}) {
  const [mode, setMode] = useState<ReadingMode>("horizontal");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ReadingMode | null;
    if (saved === "vertical" || saved === "horizontal") {
      setMode(saved);
      onChange(saved);
    }
  }, [onChange]);

  const toggle = (newMode: ReadingMode) => {
    setMode(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
    onChange(newMode);
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] p-0.5">
      <button
        onClick={() => toggle("horizontal")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          mode === "horizontal"
            ? "bg-[var(--color-primary)] text-white"
            : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        }`}
        title="横書き"
      >
        <AlignLeft size={14} />
        横書き
      </button>
      <button
        onClick={() => toggle("vertical")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          mode === "vertical"
            ? "bg-[var(--color-primary)] text-white"
            : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        }`}
        title="縦書き"
      >
        <AlignJustify size={14} className="rotate-90" />
        縦書き
      </button>
    </div>
  );
}
