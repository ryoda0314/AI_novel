"use client";

import type { NovelCharacter } from "@/lib/novel-markup";
import { User } from "lucide-react";

export function CharacterCard({ character }: { character: NovelCharacter }) {
  return (
    <div className="novel-character-card">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-[var(--color-muted)] flex items-center justify-center">
          <User size={16} className="text-[var(--color-muted-foreground)]" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm">
            {character.name}
            {character.reading && (
              <span className="ml-1.5 text-xs font-normal text-[var(--color-muted-foreground)]">
                ({character.reading})
              </span>
            )}
          </div>
          {character.description && (
            <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5 leading-relaxed">
              {character.description}
            </p>
          )}
          {character.traits && character.traits.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {character.traits.map((trait) => (
                <span
                  key={trait}
                  className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                >
                  {trait}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
