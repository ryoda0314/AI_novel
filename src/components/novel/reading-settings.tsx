"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings2,
  X,
  AlignLeft,
  AlignJustify,
  Type,
  Minus,
  Plus,
} from "lucide-react";

export interface ReadingSettings {
  mode: "horizontal" | "vertical";
  fontSize: number; // 14-24
  fontFamily: "serif" | "sans";
  lineHeight: number; // 1.6-2.4
  theme: "default" | "sepia" | "dark" | "black";
}

const STORAGE_KEY = "novel-reading-settings";

const DEFAULT_SETTINGS: ReadingSettings = {
  mode: "horizontal",
  fontSize: 17,
  fontFamily: "serif",
  lineHeight: 2.0,
  theme: "default",
};

const THEMES: { key: ReadingSettings["theme"]; label: string; bg: string; fg: string }[] = [
  { key: "default", label: "標準", bg: "#ffffff", fg: "#171717" },
  { key: "sepia", label: "セピア", bg: "#f5f0e8", fg: "#3d3229" },
  { key: "dark", label: "ダーク", bg: "#1a1a2e", fg: "#d4d4d4" },
  { key: "black", label: "黒", bg: "#0a0a0a", fg: "#c0c0c0" },
];

function loadSettings(): ReadingSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // 旧形式（reading-mode のみ保存されている場合）の移行
      const oldMode = localStorage.getItem("novel-reading-mode");
      if (oldMode && !raw) {
        return { ...DEFAULT_SETTINGS, mode: oldMode as "horizontal" | "vertical" };
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
    // 旧形式からの移行
    const oldMode = localStorage.getItem("novel-reading-mode");
    if (oldMode === "vertical" || oldMode === "horizontal") {
      return { ...DEFAULT_SETTINGS, mode: oldMode };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export function useReadingSettings() {
  const [settings, setSettingsState] = useState<ReadingSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettingsState(loadSettings());
    setLoaded(true);
  }, []);

  const setSettings = useCallback((update: Partial<ReadingSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...update };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { settings, setSettings, loaded };
}

/** 設定から reading-content に適用するスタイルを生成 */
export function getReadingStyle(settings: ReadingSettings): React.CSSProperties {
  const theme = THEMES.find((t) => t.key === settings.theme) ?? THEMES[0];
  return {
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight,
    fontFamily:
      settings.fontFamily === "serif"
        ? 'var(--font-serif)'
        : 'var(--font-sans)',
    backgroundColor: theme.bg,
    color: theme.fg,
    borderRadius: "8px",
    padding: "2rem 1.5rem",
  };
}

export function ReadingSettingsPanel({
  settings,
  onChange,
}: {
  settings: ReadingSettings;
  onChange: (update: Partial<ReadingSettings>) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-[var(--color-border)] ${
          open
            ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
            : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
        }`}
        title="表示設定"
      >
        <Settings2 size={14} />
        表示設定
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl shadow-xl z-50 overflow-hidden">
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <span className="text-sm font-semibold">表示設定</span>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-4 space-y-5">
            {/* 読み方向 */}
            <div>
              <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-2 block">
                読み方向
              </label>
              <div className="flex gap-1 p-0.5 rounded-lg border border-[var(--color-border)]">
                <button
                  onClick={() => onChange({ mode: "horizontal" })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    settings.mode === "horizontal"
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  <AlignLeft size={12} /> 横書き
                </button>
                <button
                  onClick={() => onChange({ mode: "vertical" })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    settings.mode === "vertical"
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  <AlignJustify size={12} className="rotate-90" /> 縦書き
                </button>
              </div>
            </div>

            {/* フォントサイズ */}
            <div>
              <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-2 block">
                文字サイズ <span className="text-[var(--color-foreground)]">{settings.fontSize}px</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onChange({ fontSize: Math.max(12, settings.fontSize - 1) })}
                  className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors"
                  disabled={settings.fontSize <= 12}
                >
                  <Minus size={12} />
                </button>
                <input
                  type="range"
                  min={12}
                  max={26}
                  value={settings.fontSize}
                  onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
                  className="flex-1 accent-[var(--color-primary)]"
                />
                <button
                  onClick={() => onChange({ fontSize: Math.min(26, settings.fontSize + 1) })}
                  className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors"
                  disabled={settings.fontSize >= 26}
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {/* フォント */}
            <div>
              <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-2 block">
                フォント
              </label>
              <div className="flex gap-1 p-0.5 rounded-lg border border-[var(--color-border)]">
                <button
                  onClick={() => onChange({ fontFamily: "serif" })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    settings.fontFamily === "serif"
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  <Type size={12} /> 明朝体
                </button>
                <button
                  onClick={() => onChange({ fontFamily: "sans" })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    settings.fontFamily === "sans"
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  <Type size={12} /> ゴシック体
                </button>
              </div>
            </div>

            {/* 行間 */}
            <div>
              <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-2 block">
                行間 <span className="text-[var(--color-foreground)]">{settings.lineHeight.toFixed(1)}</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--color-muted-foreground)]">狭い</span>
                <input
                  type="range"
                  min={1.4}
                  max={2.8}
                  step={0.1}
                  value={settings.lineHeight}
                  onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
                  className="flex-1 accent-[var(--color-primary)]"
                />
                <span className="text-[10px] text-[var(--color-muted-foreground)]">広い</span>
              </div>
            </div>

            {/* テーマ */}
            <div>
              <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-2 block">
                配色テーマ
              </label>
              <div className="flex gap-2">
                {THEMES.map((theme) => (
                  <button
                    key={theme.key}
                    onClick={() => onChange({ theme: theme.key })}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border-2 transition-colors ${
                      settings.theme === theme.key
                        ? "border-[var(--color-primary)]"
                        : "border-[var(--color-border)] hover:border-[var(--color-muted-foreground)]"
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full border border-[var(--color-border)]"
                      style={{ backgroundColor: theme.bg }}
                    >
                      <span
                        className="flex items-center justify-center h-full text-[8px] font-bold"
                        style={{ color: theme.fg }}
                      >
                        Aa
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--color-muted-foreground)]">
                      {theme.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
