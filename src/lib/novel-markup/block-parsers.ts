// ===== System ブロック内部パーサー =====

export type SystemEntryType = "label" | "kv" | "arrow" | "text" | "empty";

export interface SystemEntry {
  type: SystemEntryType;
  /** label: ラベルテキスト, kv: キー, text/arrow: テキスト全体 */
  text: string;
  /** kv の場合のバリュー */
  value?: string;
}

// KVパターン: 行頭から最初の `: ` まで全角半角英数字・アンダースコアのみ
const KV_REGEX = /^([\w\u3000-\u9FFF\uFF00-\uFFEF]+): (.+)$/;

/**
 * :::system ブロックの本文をパースする
 *
 * - [ラベル] → サブヘッダー
 * - Key: Value → KVペア（行頭からキー部分が英数字等のみの場合）
 * - → を含む行 → アロー行
 * - 空行 → 空白エントリ
 * - それ以外 → テキスト行
 */
export function parseSystemContent(content: string): SystemEntry[] {
  const lines = content.split("\n");
  const entries: SystemEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // 空行
    if (trimmed === "") {
      entries.push({ type: "empty", text: "" });
      continue;
    }

    // [ラベル] サブヘッダー
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      entries.push({
        type: "label",
        text: trimmed.slice(1, -1),
      });
      continue;
    }

    // Key: Value ペア
    const kvMatch = trimmed.match(KV_REGEX);
    if (kvMatch) {
      entries.push({
        type: "kv",
        text: kvMatch[1],
        value: kvMatch[2],
      });
      continue;
    }

    // → を含む行
    if (trimmed.includes("→")) {
      entries.push({ type: "arrow", text: trimmed });
      continue;
    }

    // 通常テキスト
    entries.push({ type: "text", text: trimmed });
  }

  return entries;
}

// ===== Message ブロック内部パーサー =====

export type ChatAlign = "left" | "right" | "center";

export interface ChatMessage {
  speaker: string;
  text: string;
  align: ChatAlign;
}

const SELF_NAMES = new Set(["self", "自分"]);
const SYSTEM_NAMES = new Set(["system", "システム"]);

/**
 * chat形式のメッセージをパースする
 * 各行 "発言者: テキスト" を解析し、左右中央の配置を決定する
 */
export function parseChatContent(content: string): ChatMessage[] {
  const lines = content.split("\n");
  const messages: ChatMessage[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") continue;

    const colonIndex = trimmed.indexOf(": ");
    if (colonIndex === -1) {
      // コロンなしの行は前のメッセージの続きまたはシステムメッセージ
      messages.push({ speaker: "", text: trimmed, align: "center" });
      continue;
    }

    const speaker = trimmed.slice(0, colonIndex);
    const text = trimmed.slice(colonIndex + 2);

    let align: ChatAlign = "left";
    if (SELF_NAMES.has(speaker)) {
      align = "right";
    } else if (SYSTEM_NAMES.has(speaker)) {
      align = "center";
    }

    messages.push({ speaker, text, align });
  }

  return messages;
}

export interface EmailParts {
  headers: { key: string; value: string }[];
  body: string;
}

/**
 * email形式のメッセージをパースする
 * --- の前をヘッダー、後を本文として分割する
 */
export function parseEmailContent(content: string): EmailParts {
  const lines = content.split("\n");
  const separatorIndex = lines.findIndex((l) => l.trim() === "---");

  let headerLines: string[];
  let bodyLines: string[];

  if (separatorIndex !== -1) {
    headerLines = lines.slice(0, separatorIndex);
    bodyLines = lines.slice(separatorIndex + 1);
  } else {
    headerLines = [];
    bodyLines = lines;
  }

  const headers: { key: string; value: string }[] = [];
  for (const line of headerLines) {
    const trimmed = line.trim();
    if (trimmed === "") continue;
    const colonIndex = trimmed.indexOf(": ");
    if (colonIndex !== -1) {
      headers.push({
        key: trimmed.slice(0, colonIndex),
        value: trimmed.slice(colonIndex + 2),
      });
    }
  }

  return {
    headers,
    body: bodyLines.join("\n").trim(),
  };
}

// ===== Code ブロック: spell言語トークナイザ =====

export type SpellTokenType =
  | "keyword"
  | "type"
  | "element"
  | "constant"
  | "operator"
  | "number"
  | "comment"
  | "punctuation"
  | "text";

export interface SpellToken {
  type: SpellTokenType;
  value: string;
}

const SPELL_KEYWORDS = new Set([
  "CAST",
  "Execute",
  "INVOKE",
  "BIND",
  "RELEASE",
  "CHAIN",
  "IF",
  "LOOP",
]);

const SPELL_TYPES = new Set([
  "Int",
  "Float",
  "String",
  "Bool",
  "Vector3",
  "Null",
  "Void",
]);

const SPELL_ELEMENTS = new Set([
  "Fire",
  "Water",
  "Earth",
  "Wind",
  "Light",
  "Dark",
  "Lightning",
]);

const SPELL_CONSTANTS = new Set([
  "FORWARD",
  "SELF",
  "TARGET",
  "ALL_ENEMIES",
  "AREA",
]);

const SPELL_OPERATORS = ["->", "::", "=>", "="];
const SPELL_PUNCTUATION = new Set([
  "(",
  ")",
  "<",
  ">",
  ",",
  ";",
  "{",
  "}",
]);

/**
 * spell言語の1行をトークナイズする
 */
export function tokenizeSpellLine(line: string): SpellToken[] {
  const tokens: SpellToken[] = [];
  let pos = 0;

  while (pos < line.length) {
    // コメント
    if (line.startsWith("//", pos)) {
      tokens.push({ type: "comment", value: line.slice(pos) });
      break;
    }

    // 空白
    const wsMatch = line.slice(pos).match(/^\s+/);
    if (wsMatch) {
      tokens.push({ type: "text", value: wsMatch[0] });
      pos += wsMatch[0].length;
      continue;
    }

    // 数値リテラル
    const numMatch = line.slice(pos).match(/^\d+(\.\d+)?/);
    if (numMatch) {
      tokens.push({ type: "number", value: numMatch[0] });
      pos += numMatch[0].length;
      continue;
    }

    // 演算子（長いものから先にマッチ）
    let opMatched = false;
    for (const op of SPELL_OPERATORS) {
      if (line.startsWith(op, pos)) {
        tokens.push({ type: "operator", value: op });
        pos += op.length;
        opMatched = true;
        break;
      }
    }
    if (opMatched) continue;

    // 句読点
    if (SPELL_PUNCTUATION.has(line[pos])) {
      tokens.push({ type: "punctuation", value: line[pos] });
      pos++;
      continue;
    }

    // 識別子・キーワード
    const idMatch = line.slice(pos).match(/^[A-Za-z_]\w*/);
    if (idMatch) {
      const word = idMatch[0];
      let type: SpellTokenType = "text";
      if (SPELL_KEYWORDS.has(word)) type = "keyword";
      else if (SPELL_TYPES.has(word)) type = "type";
      else if (SPELL_ELEMENTS.has(word)) type = "element";
      else if (SPELL_CONSTANTS.has(word)) type = "constant";
      tokens.push({ type, value: word });
      pos += word.length;
      continue;
    }

    // その他の文字
    tokens.push({ type: "text", value: line[pos] });
    pos++;
  }

  return tokens;
}
