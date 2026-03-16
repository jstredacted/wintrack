/**
 * CategorySummary — per-category completion counts
 *
 * Renders null when:
 * - wins is empty or undefined
 * - all wins share the same category (single-group breakdown has no value)
 *
 * Otherwise renders "CATEGORY: completed/total" for each group.
 */
import type { Database } from '@/lib/database.types';

type Win = Database['public']['Tables']['wins']['Row'];

interface CategorySummaryProps {
  wins?: Win[];
}

export default function CategorySummary({ wins }: CategorySummaryProps) {
  if (!wins || wins.length === 0) return null;

  // Group wins by category (fallback to 'work' for wins without a category)
  const groups: Record<string, { total: number; completed: number }> = {};
  for (const win of wins) {
    const cat = win.category ?? 'work';
    if (!groups[cat]) {
      groups[cat] = { total: 0, completed: 0 };
    }
    groups[cat].total += 1;
    if (win.completed) groups[cat].completed += 1;
  }

  // Single category — no value in showing breakdown
  if (Object.keys(groups).length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-4 font-mono text-xs text-muted-foreground">
      {Object.entries(groups).map(([cat, { completed, total }]) => (
        <span
          key={cat}
          className="uppercase tracking-[0.15em]"
        >
          {`${cat}: ${completed}/${total}`}
        </span>
      ))}
    </div>
  );
}
