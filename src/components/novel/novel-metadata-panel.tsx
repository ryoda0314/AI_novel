"use client";

import type { NovelMetadata } from "@/lib/novel-markup";
import { CharacterCard } from "./character-card";
import { GlossaryList } from "./glossary-list";
import { TimelineView } from "./timeline-view";
import { RelationshipTable } from "./relationship-table";
import { Users, BookOpen, Clock, Link2 } from "lucide-react";

export function NovelMetadataPanel({ metadata }: { metadata: NovelMetadata }) {
  const sections = [
    {
      key: "characters",
      label: "登場人物",
      icon: Users,
      data: metadata.characters,
      render: () => (
        <div className="space-y-2">
          {metadata.characters.map((c, i) => (
            <CharacterCard key={i} character={c} />
          ))}
        </div>
      ),
    },
    {
      key: "glossary",
      label: "用語集",
      icon: BookOpen,
      data: metadata.glossary,
      render: () => <GlossaryList entries={metadata.glossary} />,
    },
    {
      key: "timeline",
      label: "時系列",
      icon: Clock,
      data: metadata.timeline,
      render: () => <TimelineView entries={metadata.timeline} />,
    },
    {
      key: "relationships",
      label: "人物関係",
      icon: Link2,
      data: metadata.relationships,
      render: () => <RelationshipTable relationships={metadata.relationships} />,
    },
  ].filter((s) => s.data.length > 0);

  if (sections.length === 0) return null;

  return (
    <div className="novel-metadata-panel">
      {sections.map((section) => (
        <details key={section.key} className="novel-metadata-section">
          <summary>
            <section.icon size={16} className="inline mr-2 align-text-bottom" />
            {section.label}
            <span className="ml-1.5 text-sm font-normal text-[var(--color-muted-foreground)]">
              ({section.data.length})
            </span>
          </summary>
          <div className="mt-2 mb-3">{section.render()}</div>
        </details>
      ))}
    </div>
  );
}
