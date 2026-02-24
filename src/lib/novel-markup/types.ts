export interface NovelCharacter {
  name: string;
  reading?: string;
  description?: string;
  traits?: string[];
}

export interface GlossaryEntry {
  term: string;
  reading?: string;
  description: string;
}

export interface TimelineEntry {
  time: string;
  event: string;
}

export interface Relationship {
  from: string;
  to: string;
  type: string;
}

export interface NovelMetadata {
  characters: NovelCharacter[];
  glossary: GlossaryEntry[];
  timeline: TimelineEntry[];
  relationships: Relationship[];
}

export interface PreprocessorResult {
  processedMarkdown: string;
  metadata: NovelMetadata;
  notes: string[];
  blocks: import("./block-types").NovelBlock[];
}
