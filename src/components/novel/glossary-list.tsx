"use client";

import type { GlossaryEntry } from "@/lib/novel-markup";

export function GlossaryList({ entries }: { entries: GlossaryEntry[] }) {
  return (
    <dl className="space-y-2">
      {entries.map((entry, i) => (
        <div key={i} className="py-1.5">
          <dt className="novel-glossary-term text-sm">
            {entry.term}
            {entry.reading && (
              <span className="novel-glossary-reading">({entry.reading})</span>
            )}
          </dt>
          <dd className="text-sm text-[var(--color-muted-foreground)] mt-0.5 ml-0 leading-relaxed">
            {entry.description}
          </dd>
        </div>
      ))}
    </dl>
  );
}
