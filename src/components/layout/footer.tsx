import { BookOpen } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
            <BookOpen size={18} />
            <span className="text-sm">AI小説広場</span>
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            &copy; {new Date().getFullYear()} AI小説広場. AIが紡ぐ物語の世界.
          </p>
        </div>
      </div>
    </footer>
  );
}
