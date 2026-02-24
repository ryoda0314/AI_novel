// :::system ブロックの型定義

export type SystemType = "default" | "info" | "warning" | "error" | "success";

export type SystemIcon =
  | "terminal"
  | "shield"
  | "sword"
  | "scroll"
  | "spark"
  | "skull"
  | "none";

export interface SystemBlock {
  kind: "system";
  name?: string;
  type: SystemType;
  icon: SystemIcon;
  content: string;
}

// :::message ブロックの型定義

export type MessageType = "chat" | "email" | "telepathy" | "letter";

export interface MessageBlock {
  kind: "message";
  type: MessageType;
  app?: string;
  content: string;
}

// :::code ブロックの型定義

export interface CodeBlock {
  kind: "code";
  lang: string;
  title?: string;
  highlight: number[];
  numbers: boolean;
  content: string;
}

export type NovelBlock = SystemBlock | MessageBlock | CodeBlock;
