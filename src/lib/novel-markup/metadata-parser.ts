import type {
  NovelCharacter,
  GlossaryEntry,
  TimelineEntry,
  Relationship,
} from "./types";

/**
 * :::ブロック内のYAML風テキストをパースする軽量パーサー
 * フルYAMLではなく、- key: value のリスト形式のみ対応
 */
function parseEntries(content: string): Record<string, string>[] {
  const entries: Record<string, string>[] = [];
  let current: Record<string, string> | null = null;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("- ")) {
      // 新しいエントリ開始
      if (current) entries.push(current);
      current = {};
      const rest = trimmed.slice(2).trim();
      const colonIdx = rest.indexOf(":");
      if (colonIdx > 0) {
        const key = rest.slice(0, colonIdx).trim();
        const val = rest.slice(colonIdx + 1).trim();
        current[key] = val;
      }
    } else if (current) {
      // 継続行 (key: value)
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx > 0) {
        const key = trimmed.slice(0, colonIdx).trim();
        const val = trimmed.slice(colonIdx + 1).trim();
        current[key] = val;
      }
    }
  }
  if (current) entries.push(current);
  return entries;
}

export function parseCharacters(content: string): NovelCharacter[] {
  return parseEntries(content).map((e) => ({
    name: e.name || "",
    reading: e.reading,
    description: e.description,
    traits: e.traits?.split(",").map((t) => t.trim()).filter(Boolean),
  }));
}

export function parseGlossary(content: string): GlossaryEntry[] {
  return parseEntries(content).map((e) => ({
    term: e.term || "",
    reading: e.reading,
    description: e.description || "",
  }));
}

export function parseTimeline(content: string): TimelineEntry[] {
  return parseEntries(content).map((e) => ({
    time: e.time || "",
    event: e.event || "",
  }));
}

export function parseRelationships(content: string): Relationship[] {
  return parseEntries(content).map((e) => ({
    from: e.from || "",
    to: e.to || "",
    type: e.type || "",
  }));
}
