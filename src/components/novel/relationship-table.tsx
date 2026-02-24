"use client";

import type { Relationship } from "@/lib/novel-markup";

export function RelationshipTable({
  relationships,
}: {
  relationships: Relationship[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-1.5 px-2 bg-[var(--color-muted)] font-semibold border border-[var(--color-border)]">
              人物
            </th>
            <th className="text-left py-1.5 px-2 bg-[var(--color-muted)] font-semibold border border-[var(--color-border)]">
              関係
            </th>
            <th className="text-left py-1.5 px-2 bg-[var(--color-muted)] font-semibold border border-[var(--color-border)]">
              相手
            </th>
          </tr>
        </thead>
        <tbody>
          {relationships.map((rel, i) => (
            <tr key={i}>
              <td className="py-1.5 px-2 border border-[var(--color-border)]">
                {rel.from}
              </td>
              <td className="py-1.5 px-2 border border-[var(--color-border)] text-[var(--color-primary)]">
                {rel.type}
              </td>
              <td className="py-1.5 px-2 border border-[var(--color-border)]">
                {rel.to}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
