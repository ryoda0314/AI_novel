"use client";

import { NovelMarkdown } from "@/components/novel/novel-markdown";
import { BookOpen, Download } from "lucide-react";

const exampleRuby = `{東京|とうきょう}の{空|そら}は今日も{蒼|あお}い。

{異世界転生|いせかいてんせい}した{勇者|ゆうしゃ}は{剣|つるぎ}を手にした。`;

const exampleDots = `彼女は..絶対に..許さないと言った。

その光景は..信じられない..ほど美しかった。`;

const exampleDialogue = `「おはようございます」
　彼女はそう言って微笑んだ。

「まさか、こんなことになるとは」
「ええ、本当に驚きましたね」`;

const exampleSceneBreak = `前の場面のテキスト。

===

次の場面のテキスト。`;

const exampleNote = `本文のテキストが続きます。

:::note
この部分は作者による補足説明です。
物語の設定に関する追加情報などを記載できます。
:::

物語の続き。`;

const exampleCharacters = `:::characters
- name: 田中太郎
  reading: たなかたろう
  description: 本作の主人公。普通の高校生だったが、異世界に召喚される。
  traits: 真面目, 内向的, 正義感が強い
- name: 鈴木花子
  reading: すずきはなこ
  description: 太郎の幼馴染。魔法の才能を持つ。
  traits: 明るい, 好奇心旺盛
:::`;

const exampleGlossary = `:::glossary
- term: 虚空回廊
  reading: きょくうかいろう
  description: 現世と異世界を繋ぐ次元の通路。年に一度だけ開く。
- term: 聖剣エクスカリバー
  reading: せいけんエクスカリバー
  description: 勇者のみが抜くことのできる伝説の剣。
:::`;

const exampleTimeline = `:::timeline
- time: 第1章 - 春
  event: 太郎が虚空回廊を発見する
- time: 第2章 - 夏
  event: 花子と合流し、冒険の旅に出る
- time: 第3章 - 秋
  event: 魔王軍との最初の戦闘
:::`;

const exampleRelationships = `:::relationships
- from: 田中太郎
  to: 鈴木花子
  type: 幼馴染
- from: 田中太郎
  to: 魔王ゼノス
  type: 宿敵
:::`;

const exampleMath = `物理学の基本方程式：$E = mc^2$

シュレディンガー方程式：

$$i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi$$`;

// 拡張ブロック記法の例
const exampleSystem = `:::system name="ゼロ" type="info" icon="spark"
はじめまして、ユーザー様。
案内精霊のゼロと申します。

[ステータス]
HP: 100/100
MP: 450/450
→ チュートリアル開始
:::`;

const exampleSystemWarning = `:::system name="SYSTEM" type="warning" icon="skull"
警告。

種別: ダイアウルフ・アーマード
脅威レベル: C+
推奨対処: 中級術者3名以上
:::`;

const exampleSystemSuccess = `:::system type="success" icon="spark"
スキル「曖昧詠唱」を獲得しました。
:::`;

const exampleChat = `:::message type="chat" app="LINE"
田中: お疲れ！今日飲みに行かない？
自分: いいよ！何時？
田中: 7時に駅前で
田中: あ、山田も呼んでいい？
自分: おけ
システム: 山田が参加しました
山田: よろしくー
:::`;

const exampleTelepathy = `:::message type="telepathy"
リーネ: 聞こえる？　これが念話よ。
自分: うわ、頭の中に直接……
リーネ: 慣れなさい。これから作戦を伝えるわ。
:::`;

const exampleEmail = `:::message type="email"
差出人: 王立魔法学院 学務課
件名: 【重要】入学試験結果のお知らせ
---
藤堂蓮 殿

選考の結果、貴殿の入学を許可いたします。
入学手続きの詳細は添付書類をご確認ください。

王立魔法学院 学務課長
エルドラ・ヴァイス
:::`;

const exampleLetter = `:::message type="letter"
親愛なる息子へ

村はいつもと変わりなく穏やかです。
体には気をつけて、学業に励みなさい。

母より
:::`;

const exampleSpellCode = `:::code lang="spell" title="初級火球魔法"
CAST<Fire>(
  power: Int = 3,
  range: Float = 10.0,
  target: Vector3 = FORWARD,
  duration: Null
) -> Execute;
:::`;

const examplePythonCode = `:::code lang="python" title="禁断のスクリプト"
import world

def destroy_everything():
    for entity in world.get_all():
        entity.delete()

destroy_everything()  // これはやめましょう
:::`;

// Markdownダウンロード用コンテンツ
const guideMarkdown = `# AI小説広場 記法ガイド

AI小説広場では、標準的なMarkdownに加えて小説執筆に特化した独自記法が使えます。

---

## インライン記法

### ルビ（振り仮名）

\`{漢字|かんじ}\` と記述すると振り仮名が付きます。

\`\`\`
{東京|とうきょう}の{空|そら}は{蒼|あお}い。
\`\`\`

### 傍点（強調点）

\`..テキスト..\` で囲むと傍点（ゴマ点）が表示されます。

\`\`\`
彼女は..絶対に..許さないと言った。
\`\`\`

### 台詞（自動検出）

「」で始まる段落は自動的に台詞として字下げなしで表示されます。

---

## ブロック記法

### 場面転換

行の先頭に \`===\` だけを書くと装飾付きの場面転換になります。

\`\`\`
前の場面のテキスト。

===

次の場面のテキスト。
\`\`\`

### 作者注

\`\`\`
:::note
ここに作者の補足説明を記入
:::
\`\`\`

---

## 拡張ブロック記法

### システムUI（:::system）

ゲームのステータス画面やシステム通知を表現します。

**属性:**
- \`name\` — ヘッダーに表示する名前（例: \`name="SYSTEM"\`）
- \`type\` — 表示スタイル: \`default\`, \`info\`, \`warning\`, \`error\`, \`success\`
- \`icon\` — アイコン: \`terminal\`, \`shield\`, \`sword\`, \`scroll\`, \`spark\`, \`skull\`, \`none\`

**本文内の特殊記法:**
- \`[ラベル]\` — サブヘッダー
- \`項目: 値\` — キー・バリューペア
- \`→\` — アクセント付き矢印

\`\`\`
:::system name="ゼロ" type="info" icon="spark"
はじめまして、ユーザー様。

[ステータス]
HP: 100/100
MP: 450/450
→ チュートリアル開始
:::
\`\`\`

### メッセージ（:::message）

チャット、メール、手紙、念話などを表現します。

**属性:**
- \`type\` — 表示形式: \`chat\`, \`email\`, \`telepathy\`, \`letter\`
- \`app\` — アプリ名（例: \`app="LINE"\`）

#### chat（チャット風）
各行を \`発言者: テキスト\` の形式で記述します。
- \`自分\` または \`self\` → 右寄せ（自分の発言）
- \`システム\` または \`system\` → 中央寄せ（通知）

\`\`\`
:::message type="chat" app="LINE"
田中: お疲れ！今日飲みに行かない？
自分: いいよ！何時？
システム: 山田が参加しました
:::
\`\`\`

#### email（メール風）
\`---\` の前がヘッダー（差出人・件名等）、後が本文になります。

\`\`\`
:::message type="email"
差出人: 王立魔法学院 学務課
件名: 【重要】入学試験結果のお知らせ
---
本文をここに記入
:::
\`\`\`

#### telepathy（念話）
\`\`\`
:::message type="telepathy"
リーネ: 聞こえる？　これが念話よ。
自分: うわ、頭の中に直接……
:::
\`\`\`

#### letter（手紙）
\`\`\`
:::message type="letter"
親愛なる息子へ

村はいつもと変わりなく穏やかです。

母より
:::
\`\`\`

### コード（:::code）

作中のプログラムコードや詠唱式を表示します。

**属性:**
- \`lang\` — 言語（\`spell\` で詠唱式用ハイライト、その他は汎用表示）
- \`title\` — タイトル
- \`highlight\` — ハイライトする行番号（例: \`highlight="1,3-5"\`）
- \`numbers\` — 行番号の表示（デフォルト: true）

\`\`\`
:::code lang="spell" title="初級火球魔法"
CAST<Fire>(
  power: Int = 3,
  range: Float = 10.0,
  target: Vector3 = FORWARD
) -> Execute;
:::
\`\`\`

**spell言語のキーワード:**
- 命令: CAST, Execute, INVOKE, BIND, RELEASE, CHAIN, IF, LOOP
- 型: Int, Float, String, Bool, Vector3, Null, Void
- 属性: Fire, Water, Earth, Wind, Light, Dark, Lightning
- 定数: FORWARD, SELF, TARGET, ALL_ENEMIES, AREA

---

## 構造化メタデータ

章の末尾などに記述すると、折りたたみ式パネルで表示されます。

### 人物定義（:::characters）
\`\`\`
:::characters
- name: 田中太郎
  reading: たなかたろう
  description: 主人公の説明
  traits: 真面目, 内向的
:::
\`\`\`

### 用語集（:::glossary）
\`\`\`
:::glossary
- term: 用語名
  reading: よみがな
  description: 用語の説明
:::
\`\`\`

### 時系列（:::timeline）
\`\`\`
:::timeline
- time: 第1章 - 春
  event: 出来事の説明
:::
\`\`\`

### 人物関係（:::relationships）
\`\`\`
:::relationships
- from: 田中太郎
  to: 鈴木花子
  type: 幼馴染
:::
\`\`\`

---

## 数式（TeX / LaTeX）

- インライン: \`$E = mc^2$\`
- ブロック: \`$$...$$\`

---

## 標準Markdown

| 記法 | 構文 | 用途 |
|------|------|------|
| 見出し | \`# 見出し1\` / \`## 見出し2\` | 章タイトル |
| 太字 | \`**太字**\` | 強調 |
| 斜体 | \`*斜体*\` | 外国語・思考 |
| 取消線 | \`~~取消~~\` | 訂正表現 |
| 引用 | \`> 引用文\` | 手紙・引用 |
| リスト | \`- 項目\` / \`1. 項目\` | 箇条書き |
`;

function SyntaxExample({
  title,
  syntax,
  rendered,
}: {
  title: string;
  syntax: string;
  rendered: string;
}) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold mb-3">{title}</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1">
            入力（記法）
          </div>
          <pre className="p-4 rounded-lg bg-[var(--color-muted)] border border-[var(--color-border)] text-sm overflow-x-auto whitespace-pre-wrap break-all">
            {syntax}
          </pre>
        </div>
        <div>
          <div className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1">
            表示結果
          </div>
          <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]">
            <NovelMarkdown
              content={rendered}
              className="reading-content markdown-body"
              showMetadata={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DownloadButton() {
  const handleDownload = () => {
    const blob = new Blob([guideMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "AI小説広場_記法ガイド.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-sm font-medium hover:bg-[var(--color-muted)] transition-colors"
    >
      <Download size={16} />
      Markdownでダウンロード
    </button>
  );
}

export default function GuidePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <BookOpen size={28} className="text-[var(--color-primary)]" />
          <h1 className="text-2xl font-bold">記法ガイド</h1>
        </div>
        <DownloadButton />
      </div>
      <p className="text-[var(--color-muted-foreground)] mb-8">
        AI小説広場では、標準的なMarkdownに加えて小説執筆に特化した独自記法が使えます。
      </p>

      {/* インライン記法 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b border-[var(--color-border)]">
          インライン記法
        </h2>

        <SyntaxExample
          title="ルビ（振り仮名）"
          syntax={`{漢字|かんじ}\n{東京|とうきょう}の{空|そら}は{蒼|あお}い。`}
          rendered={exampleRuby}
        />

        <SyntaxExample
          title="傍点（強調点）"
          syntax={`..テキスト..\n彼女は..絶対に..許さないと言った。`}
          rendered={exampleDots}
        />

        <SyntaxExample
          title="台詞（自動検出）"
          syntax={`「」で始まる段落は自動的に台詞として\n字下げなしで表示されます。\n\n「こんにちは」\n　地の文は通常通り字下げされます。`}
          rendered={exampleDialogue}
        />
      </section>

      {/* ブロック記法 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b border-[var(--color-border)]">
          ブロック記法
        </h2>

        <SyntaxExample
          title="場面転換"
          syntax={`===\n\n行の先頭に「===」だけを書くと\n装飾付きの場面転換になります。`}
          rendered={exampleSceneBreak}
        />

        <SyntaxExample
          title="作者注"
          syntax={`:::note\nここに作者の補足説明を記入\n:::`}
          rendered={exampleNote}
        />
      </section>

      {/* 拡張ブロック記法 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b border-[var(--color-border)]">
          拡張ブロック記法
        </h2>
        <p className="text-[var(--color-muted-foreground)] mb-6">
          小説中にシステムUI、チャット、コードなどの特殊な表示を挿入できます。
          異世界もの、VRMMO、SF、プログラミング系など幅広いジャンルで活用できます。
        </p>

        {/* :::system */}
        <div className="mb-10">
          <h3 className="text-lg font-bold mb-2">システムUI（:::system）</h3>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
            ゲームのステータス画面やシステム通知を表現します。
          </p>
          <div className="mb-3 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--color-muted)]">
                  <th className="border border-[var(--color-border)] px-3 py-1.5 text-left">属性</th>
                  <th className="border border-[var(--color-border)] px-3 py-1.5 text-left">値</th>
                  <th className="border border-[var(--color-border)] px-3 py-1.5 text-left">説明</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-[var(--color-border)] px-3 py-1.5 font-mono">name</td>
                  <td className="border border-[var(--color-border)] px-3 py-1.5">文字列</td>
                  <td className="border border-[var(--color-border)] px-3 py-1.5">ヘッダーの名前（省略可）</td>
                </tr>
                <tr>
                  <td className="border border-[var(--color-border)] px-3 py-1.5 font-mono">type</td>
                  <td className="border border-[var(--color-border)] px-3 py-1.5 font-mono">default, info, warning, error, success</td>
                  <td className="border border-[var(--color-border)] px-3 py-1.5">表示スタイル</td>
                </tr>
                <tr>
                  <td className="border border-[var(--color-border)] px-3 py-1.5 font-mono">icon</td>
                  <td className="border border-[var(--color-border)] px-3 py-1.5 font-mono">terminal, shield, sword, scroll, spark, skull, none</td>
                  <td className="border border-[var(--color-border)] px-3 py-1.5">アイコン</td>
                </tr>
              </tbody>
            </table>
          </div>

          <SyntaxExample
            title="info + サブヘッダー・KV"
            syntax={`:::system name="ゼロ" type="info" icon="spark"\nはじめまして、ユーザー様。\n\n[ステータス]\nHP: 100/100\nMP: 450/450\n→ チュートリアル開始\n:::`}
            rendered={exampleSystem}
          />
          <SyntaxExample
            title="warning（警告）"
            syntax={`:::system name="SYSTEM" type="warning" icon="skull"\n警告。\n\n種別: ダイアウルフ・アーマード\n脅威レベル: C+\n推奨対処: 中級術者3名以上\n:::`}
            rendered={exampleSystemWarning}
          />
          <SyntaxExample
            title="success（成功）"
            syntax={`:::system type="success" icon="spark"\nスキル「曖昧詠唱」を獲得しました。\n:::`}
            rendered={exampleSystemSuccess}
          />
        </div>

        {/* :::message */}
        <div className="mb-10">
          <h3 className="text-lg font-bold mb-2">メッセージ（:::message）</h3>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
            チャット、メール、手紙、念話などを表現します。
          </p>
          <div className="mb-3 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--color-muted)]">
                  <th className="border border-[var(--color-border)] px-3 py-1.5 text-left">属性</th>
                  <th className="border border-[var(--color-border)] px-3 py-1.5 text-left">値</th>
                  <th className="border border-[var(--color-border)] px-3 py-1.5 text-left">説明</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-[var(--color-border)] px-3 py-1.5 font-mono">type</td>
                  <td className="border border-[var(--color-border)] px-3 py-1.5 font-mono">chat, email, telepathy, letter</td>
                  <td className="border border-[var(--color-border)] px-3 py-1.5">表示形式</td>
                </tr>
                <tr>
                  <td className="border border-[var(--color-border)] px-3 py-1.5 font-mono">app</td>
                  <td className="border border-[var(--color-border)] px-3 py-1.5">文字列</td>
                  <td className="border border-[var(--color-border)] px-3 py-1.5">アプリ名（chatで表示）</td>
                </tr>
              </tbody>
            </table>
          </div>

          <SyntaxExample
            title="chat（チャット風）"
            syntax={`:::message type="chat" app="LINE"\n田中: お疲れ！今日飲みに行かない？\n自分: いいよ！何時？\n田中: 7時に駅前で\nシステム: 山田が参加しました\n山田: よろしくー\n:::\n\n※「自分」→右寄せ、「システム」→中央寄せ`}
            rendered={exampleChat}
          />
          <SyntaxExample
            title="telepathy（念話）"
            syntax={`:::message type="telepathy"\nリーネ: 聞こえる？　これが念話よ。\n自分: うわ、頭の中に直接……\n:::`}
            rendered={exampleTelepathy}
          />
          <SyntaxExample
            title="email（メール風）"
            syntax={`:::message type="email"\n差出人: 王立魔法学院\n件名: 入学試験結果のお知らせ\n---\n本文をここに記入\n:::\n\n※ --- の前がヘッダー、後が本文`}
            rendered={exampleEmail}
          />
          <SyntaxExample
            title="letter（手紙風）"
            syntax={`:::message type="letter"\n親愛なる息子へ\n\n村はいつもと変わりなく穏やかです。\n\n母より\n:::`}
            rendered={exampleLetter}
          />
        </div>

        {/* :::code */}
        <div className="mb-10">
          <h3 className="text-lg font-bold mb-2">コード（:::code）</h3>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
            作中のプログラムコードや詠唱式を表示します。
            <code className="mx-1 px-1.5 py-0.5 rounded bg-[var(--color-muted)] text-xs">lang=&quot;spell&quot;</code>
            で詠唱式専用のハイライトが適用されます。
          </p>
          <div className="mb-3 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--color-muted)]">
                  <th className="border border-[var(--color-border)] px-3 py-1.5 text-left">属性</th>
                  <th className="border border-[var(--color-border)] px-3 py-1.5 text-left">値</th>
                  <th className="border border-[var(--color-border)] px-3 py-1.5 text-left">説明</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-[var(--color-border)] px-3 py-1.5 font-mono">lang</td>
                  <td className="border border-[var(--color-border)] px-3 py-1.5 font-mono">spell, python, plain, ...</td>
                  <td className="border border-[var(--color-border)] px-3 py-1.5">言語（spellで詠唱式ハイライト）</td>
                </tr>
                <tr>
                  <td className="border border-[var(--color-border)] px-3 py-1.5 font-mono">title</td>
                  <td className="border border-[var(--color-border)] px-3 py-1.5">文字列</td>
                  <td className="border border-[var(--color-border)] px-3 py-1.5">タイトル（ヘッダーに表示）</td>
                </tr>
                <tr>
                  <td className="border border-[var(--color-border)] px-3 py-1.5 font-mono">highlight</td>
                  <td className="border border-[var(--color-border)] px-3 py-1.5 font-mono">&quot;1,3-5&quot;</td>
                  <td className="border border-[var(--color-border)] px-3 py-1.5">ハイライト行</td>
                </tr>
                <tr>
                  <td className="border border-[var(--color-border)] px-3 py-1.5 font-mono">numbers</td>
                  <td className="border border-[var(--color-border)] px-3 py-1.5 font-mono">true / false</td>
                  <td className="border border-[var(--color-border)] px-3 py-1.5">行番号の表示</td>
                </tr>
              </tbody>
            </table>
          </div>

          <SyntaxExample
            title="詠唱式（spell言語）"
            syntax={`:::code lang="spell" title="初級火球魔法"\nCAST<Fire>(\n  power: Int = 3,\n  range: Float = 10.0,\n  target: Vector3 = FORWARD,\n  duration: Null\n) -> Execute;\n:::`}
            rendered={exampleSpellCode}
          />
          <SyntaxExample
            title="一般的なコード"
            syntax={`:::code lang="python" title="禁断のスクリプト"\nimport world\n\ndef destroy_everything():\n    for entity in world.get_all():\n        entity.delete()\n:::`}
            rendered={examplePythonCode}
          />
        </div>
      </section>

      {/* 構造化メタデータ */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b border-[var(--color-border)]">
          構造化メタデータ
        </h2>
        <p className="text-[var(--color-muted-foreground)] mb-6">
          章の末尾などにメタデータブロックを記述すると、折りたたみ式のパネルとして表示されます。
          読者が人物や用語を確認するのに便利です。
        </p>

        <SyntaxExample
          title="人物定義（:::characters）"
          syntax={`:::characters\n- name: 田中太郎\n  reading: たなかたろう\n  description: 主人公の説明\n  traits: 真面目, 内向的\n:::`}
          rendered={exampleCharacters}
        />

        <SyntaxExample
          title="用語集（:::glossary）"
          syntax={`:::glossary\n- term: 用語名\n  reading: よみがな\n  description: 用語の説明\n:::`}
          rendered={exampleGlossary}
        />

        <SyntaxExample
          title="時系列（:::timeline）"
          syntax={`:::timeline\n- time: 第1章 - 春\n  event: 出来事の説明\n:::`}
          rendered={exampleTimeline}
        />

        <SyntaxExample
          title="人物関係（:::relationships）"
          syntax={`:::relationships\n- from: 田中太郎\n  to: 鈴木花子\n  type: 幼馴染\n:::`}
          rendered={exampleRelationships}
        />
      </section>

      {/* 数式 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b border-[var(--color-border)]">
          数式（TeX / LaTeX）
        </h2>
        <p className="text-[var(--color-muted-foreground)] mb-6">
          TeX記法で数式を表示できます。SF小説や学術系の作品で活用できます。
        </p>

        <SyntaxExample
          title="インライン数式・ブロック数式"
          syntax={`インライン: $E = mc^2$\n\nブロック:\n$$i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi$$`}
          rendered={exampleMath}
        />
      </section>

      {/* 標準Markdown */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b border-[var(--color-border)]">
          標準Markdown
        </h2>
        <p className="text-[var(--color-muted-foreground)] mb-4">
          以下の標準Markdown記法もそのまま使用できます。
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[var(--color-muted)]">
                <th className="border border-[var(--color-border)] px-4 py-2 text-left">
                  記法
                </th>
                <th className="border border-[var(--color-border)] px-4 py-2 text-left">
                  構文
                </th>
                <th className="border border-[var(--color-border)] px-4 py-2 text-left">
                  用途
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-[var(--color-border)] px-4 py-2">
                  見出し
                </td>
                <td className="border border-[var(--color-border)] px-4 py-2 font-mono text-xs">
                  # 見出し1 / ## 見出し2 / ### 見出し3
                </td>
                <td className="border border-[var(--color-border)] px-4 py-2">
                  章タイトルなど
                </td>
              </tr>
              <tr>
                <td className="border border-[var(--color-border)] px-4 py-2">
                  太字
                </td>
                <td className="border border-[var(--color-border)] px-4 py-2 font-mono text-xs">
                  **太字**
                </td>
                <td className="border border-[var(--color-border)] px-4 py-2">
                  強調
                </td>
              </tr>
              <tr>
                <td className="border border-[var(--color-border)] px-4 py-2">
                  斜体
                </td>
                <td className="border border-[var(--color-border)] px-4 py-2 font-mono text-xs">
                  *斜体*
                </td>
                <td className="border border-[var(--color-border)] px-4 py-2">
                  外国語・思考
                </td>
              </tr>
              <tr>
                <td className="border border-[var(--color-border)] px-4 py-2">
                  取消線
                </td>
                <td className="border border-[var(--color-border)] px-4 py-2 font-mono text-xs">
                  ~~取消~~
                </td>
                <td className="border border-[var(--color-border)] px-4 py-2">
                  訂正表現
                </td>
              </tr>
              <tr>
                <td className="border border-[var(--color-border)] px-4 py-2">
                  引用
                </td>
                <td className="border border-[var(--color-border)] px-4 py-2 font-mono text-xs">
                  &gt; 引用文
                </td>
                <td className="border border-[var(--color-border)] px-4 py-2">
                  手紙・引用
                </td>
              </tr>
              <tr>
                <td className="border border-[var(--color-border)] px-4 py-2">
                  リスト
                </td>
                <td className="border border-[var(--color-border)] px-4 py-2 font-mono text-xs">
                  - 項目 / 1. 項目
                </td>
                <td className="border border-[var(--color-border)] px-4 py-2">
                  箇条書き
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* エディタのヒント */}
      <section className="mb-12 p-6 rounded-xl bg-[var(--color-muted)] border border-[var(--color-border)]">
        <h2 className="text-lg font-bold mb-3">エディタのツールバー</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          章の編集画面では、ツールバーからワンクリックで独自記法を挿入できます。
          テキストを選択した状態でボタンを押すと、選択範囲に記法が適用されます。
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { icon: "文", label: "ルビ" },
            { icon: "・", label: "傍点" },
            { icon: "―", label: "区切り" },
            { icon: "注", label: "作者注" },
            { icon: "人", label: "人物" },
            { icon: "辞", label: "用語" },
            { icon: "⚙", label: "システム" },
            { icon: "💬", label: "メッセージ" },
            { icon: "{}", label: "コード" },
          ].map((btn) => (
            <span
              key={btn.label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-sm"
            >
              <span className="w-6 h-6 rounded bg-[var(--color-muted)] flex items-center justify-center text-xs font-bold">
                {btn.icon}
              </span>
              {btn.label}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
