export interface ParsedChapter {
  title: string;
  content: string;
  charCount: number;
}

export interface ParseResult {
  chapters: ParsedChapter[];
  warnings: string[];
}

export function parseMarkdownChapters(markdown: string): ParseResult {
  const lines = markdown.split("\n");
  const chapters: ParsedChapter[] = [];
  const warnings: string[] = [];
  let currentTitle: string | null = null;
  let currentContent: string[] = [];
  let hasPreContent = false;

  for (const line of lines) {
    const h1Match = line.match(/^# (.+)$/);
    if (h1Match) {
      // 前の章を確定
      if (currentTitle !== null) {
        const content = currentContent.join("\n").trim();
        chapters.push({
          title: currentTitle,
          content,
          charCount: content.length,
        });
      } else if (currentContent.some((l) => l.trim())) {
        hasPreContent = true;
      }

      // 新しい章を開始
      let title = h1Match[1].trim();
      // 「第N話 タイトル」形式からタイトルを抽出
      const numMatch = title.match(/^第\d+話\s+(.+)$/);
      if (numMatch) {
        title = numMatch[1];
      }
      currentTitle = title;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // 最後の章を確定
  if (currentTitle !== null) {
    const content = currentContent.join("\n").trim();
    chapters.push({
      title: currentTitle,
      content,
      charCount: content.length,
    });
  }

  if (hasPreContent) {
    warnings.push(
      "最初の見出し（# ）より前にテキストがありました。このテキストは無視されます。"
    );
  }

  if (chapters.length === 0) {
    warnings.push(
      "章が見つかりませんでした。「# タイトル」の形式で章を区切ってください。"
    );
  }

  // 空の章がないかチェック
  chapters.forEach((ch, i) => {
    if (!ch.content) {
      warnings.push(`${i + 1}番目の章「${ch.title}」の本文が空です。`);
    }
  });

  return { chapters, warnings };
}
