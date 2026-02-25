"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

interface TagSuggestion {
  id: string;
  name: string;
  _count: { novels: number };
}

export function TagInput({ value, onChange, maxTags = 10 }: TagInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/tags?q=${encodeURIComponent(query.trim())}`
        );
        const data: TagSuggestion[] = await res.json();
        // 既に選択済みのタグを除外
        const filtered = data.filter((t) => !value.includes(t.name));
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        setSelectedIndex(-1);
      } catch {
        setSuggestions([]);
      }
    },
    [value]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(input);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, fetchSuggestions]);

  // クリック外でサジェストを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) return;
    if (value.length >= maxTags) return;

    onChange([...value, trimmed]);
    setInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tagName: string) => {
    onChange(value.filter((t) => t !== tagName));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        addTag(suggestions[selectedIndex].name);
      } else if (input.trim()) {
        addTag(input);
      }
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const isAtLimit = value.length >= maxTags;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] min-h-[42px]">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/10"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-red-500 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {!isAtLimit && (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder={
              value.length === 0 ? "タグを入力（Enterで確定）" : "追加..."
            }
            className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-[var(--color-muted-foreground)]"
          />
        )}
      </div>

      {isAtLimit && (
        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
          タグは最大{maxTags}個までです
        </p>
      )}

      {showSuggestions && (
        <ul className="absolute z-50 w-full mt-1 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((tag, index) => (
            <li key={tag.id}>
              <button
                type="button"
                className={`w-full px-3 py-1.5 text-left text-sm flex items-center justify-between hover:bg-[var(--color-muted)] ${
                  index === selectedIndex ? "bg-[var(--color-muted)]" : ""
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(tag.name);
                }}
              >
                <span>#{tag.name}</span>
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {tag._count.novels}作品
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
