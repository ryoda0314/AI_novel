import type { Metadata } from "next";
import { Download, Monitor, BookOpen, Settings, FolderOpen, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "デスクトップリーダー ダウンロード | AI小説広場",
  description: "AI小説広場の小説をオフラインで快適に読めるデスクトップリーダーアプリをダウンロード",
};

const DOWNLOAD_URL = "/downloads/AI小説広場リーダー_0.1.0_x64-setup.exe";
const VERSION = "0.1.0";
const FILE_SIZE = "3.0 MB";

const features = [
  {
    icon: BookOpen,
    title: "全記法対応",
    description: "ルビ・傍点・台詞・場面転換・メタデータブロックなど、AI小説広場の独自記法をすべて再現",
  },
  {
    icon: FolderOpen,
    title: "本棚管理",
    description: "作品をライブラリに追加して管理。読書進捗の記録や検索も可能",
  },
  {
    icon: Settings,
    title: "読書設定",
    description: "フォントサイズ・行間・テーマ・縦書きモードなど、お好みにカスタマイズ",
  },
  {
    icon: Sparkles,
    title: ".novel形式",
    description: "新しい.novel拡張子に対応。ダブルクリックで直接開ける",
  },
];

export default function DownloadPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* ヒーローセクション */}
      <section className="text-center py-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium mb-6">
          <Monitor size={16} />
          Windows版
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          AI小説広場リーダー
        </h1>
        <p className="text-lg text-[var(--color-muted-foreground)] mb-8 max-w-2xl mx-auto">
          AI小説広場の作品をデスクトップで快適に読めるリーダーアプリ。
          オフラインでも、お好みの設定で小説を楽しめます。
        </p>

        {/* ダウンロードボタン */}
        <div className="flex flex-col items-center gap-3">
          <a
            href={DOWNLOAD_URL}
            download
            className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl bg-[var(--color-primary)] text-white font-medium text-lg hover:opacity-90 transition-opacity shadow-lg"
          >
            <Download size={22} />
            ダウンロード（Windows）
          </a>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            v{VERSION} &middot; {FILE_SIZE} &middot; Windows 10/11 (64-bit)
          </p>
        </div>
      </section>

      {/* スクリーンショット風のプレビュー */}
      <section className="mb-16">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-muted)]/50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <span className="text-xs text-[var(--color-muted-foreground)] ml-2">AI小説広場リーダー</span>
          </div>
          <div className="p-8 sm:p-12 text-center">
            <div className="max-w-md mx-auto space-y-4 text-left novel-content">
              <h2 className="text-xl font-bold text-center mb-6">旅立ちの日</h2>
              <p className="leading-relaxed">
                　朝靄の中、少年は村を出た。
              </p>
              <p className="leading-relaxed">
                「もう戻らない」
              </p>
              <p className="leading-relaxed">
                　<ruby>背嚢<rp>(</rp><rt>はいのう</rt><rp>)</rp></ruby>を背負い直し、
                <span style={{ textEmphasis: "filled dot" }}>決意</span>を胸に一歩を踏み出した。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 機能紹介 */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">主な機能</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] mb-4">
                <feature.icon size={20} />
              </div>
              <h3 className="font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* .novel形式の説明 */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">.novel ファイル形式</h2>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:p-8">
          <p className="text-[var(--color-muted-foreground)] mb-6 leading-relaxed">
            <code className="px-1.5 py-0.5 rounded bg-[var(--color-muted)] text-sm">.novel</code>はAI小説広場の独自ファイル形式です。
            テキストベースで、YAML frontmatterによるメタデータと、既存の記法による本文で構成されます。
          </p>
          <div className="rounded-lg bg-[var(--color-muted)] p-4 overflow-x-auto">
            <pre className="text-sm leading-relaxed"><code>{`---
title: 冒険の書
author: 山田太郎
genre: ファンタジー
description: 勇者が旅立つ物語
---

%% 旅立ちの日

　朝靄の中、少年は村を出た。

「もう戻らない」

　{背嚢|はいのう}を背負い直し、..決意..を胸に一歩を踏み出した。

===

　街道を半日ほど歩くと、小さな町が見えてきた。`}</code></pre>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-4">
            <code className="px-1.5 py-0.5 rounded bg-[var(--color-muted)] text-sm">.md</code>や
            <code className="px-1.5 py-0.5 rounded bg-[var(--color-muted)] text-sm">.txt</code>ファイルも読み込み可能です。
          </p>
        </div>
      </section>

      {/* システム要件 */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">システム要件</h2>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-[var(--color-border)]">
                <td className="px-6 py-3 font-medium bg-[var(--color-muted)]/50 w-1/3">OS</td>
                <td className="px-6 py-3">Windows 10 / 11 (64-bit)</td>
              </tr>
              <tr className="border-b border-[var(--color-border)]">
                <td className="px-6 py-3 font-medium bg-[var(--color-muted)]/50">メモリ</td>
                <td className="px-6 py-3">4 GB 以上</td>
              </tr>
              <tr className="border-b border-[var(--color-border)]">
                <td className="px-6 py-3 font-medium bg-[var(--color-muted)]/50">ディスク</td>
                <td className="px-6 py-3">50 MB 以上の空き容量</td>
              </tr>
              <tr>
                <td className="px-6 py-3 font-medium bg-[var(--color-muted)]/50">その他</td>
                <td className="px-6 py-3">WebView2 ランタイム（通常プリインストール済み）</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* インストール手順 */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">インストール方法</h2>
        <div className="space-y-4">
          {[
            "上のボタンからインストーラーをダウンロード",
            "ダウンロードした .exe ファイルを実行",
            "画面の指示に従ってインストール",
            ".novel ファイルをダブルクリックするとリーダーで開きます",
          ].map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm">
                {i + 1}
              </div>
              <p className="pt-1">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
