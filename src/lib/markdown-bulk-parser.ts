export interface ParsedChapter {
  title: string;
  content: string;
  charCount: number;
}

export interface ParseResult {
  chapters: ParsedChapter[];
  warnings: string[];
}

// 単一Markdownファイルから複数章をパース（H1見出し区切り）
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

      let title = h1Match[1].trim();
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

  chapters.forEach((ch, i) => {
    if (!ch.content) {
      warnings.push(`${i + 1}番目の章「${ch.title}」の本文が空です。`);
    }
  });

  return { chapters, warnings };
}

// フォルダ形式: 目次ファイル（index.md）+ 各話ファイルからパース
//
// 目次ファイルのフォーマット:
//   chapter01.md 旅立ちの日
//   chapter02.md 出会い
//   chapter03.md 森の中で
//
// 各行: <ファイル名><スペースまたはタブ><タイトル>
// 「#」で始まる行と空行は無視

export interface FileEntry {
  name: string;
  content: string;
}

const INDEX_NAMES = ["index.md", "目次.md"];

export function findIndexFile(files: FileEntry[]): FileEntry | null {
  for (const name of INDEX_NAMES) {
    const found = files.find(
      (f) => f.name.toLowerCase() === name || f.name.endsWith("/" + name)
    );
    if (found) return found;
  }
  return null;
}

interface IndexEntry {
  fileName: string;
  title: string;
}

function parseIndexFile(content: string): {
  entries: IndexEntry[];
  warnings: string[];
} {
  const entries: IndexEntry[] = [];
  const warnings: string[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // タブまたは2つ以上のスペースで区切る
    const match = trimmed.match(/^(\S+)\s+(.+)$/);
    if (match) {
      entries.push({ fileName: match[1], title: match[2].trim() });
    } else {
      warnings.push(`目次の行を解析できませんでした: 「${trimmed}」`);
    }
  }

  return { entries, warnings };
}

export function parseFolderChapters(files: FileEntry[]): ParseResult {
  const warnings: string[] = [];
  const chapters: ParsedChapter[] = [];

  const indexFile = findIndexFile(files);
  if (!indexFile) {
    warnings.push(
      `目次ファイルが見つかりませんでした。「${INDEX_NAMES.join("」または「")}」という名前のファイルを含めてください。`
    );
    return { chapters, warnings };
  }

  const { entries, warnings: indexWarnings } = parseIndexFile(
    indexFile.content
  );
  warnings.push(...indexWarnings);

  if (entries.length === 0) {
    warnings.push("目次ファイルに有効なエントリがありません。");
    return { chapters, warnings };
  }

  // ファイル名でコンテンツを引けるマップ（パス末尾のファイル名で照合）
  const fileMap = new Map<string, string>();
  for (const f of files) {
    if (f === indexFile) continue;
    const baseName = f.name.includes("/")
      ? f.name.split("/").pop()!
      : f.name;
    fileMap.set(baseName, f.content);
  }

  for (const entry of entries) {
    const content = fileMap.get(entry.fileName);
    if (content === undefined) {
      warnings.push(
        `目次に記載されたファイル「${entry.fileName}」が見つかりませんでした。`
      );
      continue;
    }

    const trimmed = content.trim();
    chapters.push({
      title: entry.title,
      content: trimmed,
      charCount: trimmed.length,
    });
  }

  if (chapters.length === 0) {
    warnings.push("有効な章が見つかりませんでした。");
  }

  chapters.forEach((ch, i) => {
    if (!ch.content) {
      warnings.push(`${i + 1}番目の章「${ch.title}」の本文が空です。`);
    }
  });

  return { chapters, warnings };
}
