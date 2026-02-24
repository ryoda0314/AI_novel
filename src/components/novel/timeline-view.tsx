"use client";

import type { TimelineEntry } from "@/lib/novel-markup";

export function TimelineView({ entries }: { entries: TimelineEntry[] }) {
  return (
    <div className="space-y-0">
      {entries.map((entry, i) => (
        <div key={i} className="novel-timeline-entry">
          <span className="novel-timeline-time">{entry.time}</span>
          <span className="text-sm">{entry.event}</span>
        </div>
      ))}
    </div>
  );
}
