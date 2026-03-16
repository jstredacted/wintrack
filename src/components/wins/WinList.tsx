import { AnimatePresence, motion } from 'motion/react';
import WinCard from './WinCard';
import type { Database } from '@/lib/database.types';

type Win = Database['public']['Tables']['wins']['Row'];

interface WinListProps {
  wins?: Win[];
  onEdit?: (winId: string, newTitle: string) => void;
  onDelete?: (winId: string) => void;
  onToggle?: (winId: string) => void;
}

export default function WinList({
  wins = [],
  onEdit,
  onDelete,
  onToggle,
  // STOPWATCH REMOVED — onStartTimer, onPauseTimer, onStopTimer,
}: WinListProps) {
  if (wins.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm font-mono text-muted-foreground">
          No wins logged yet
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {wins.map((win) => (
          <motion.div
            key={win.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* STOPWATCH REMOVED — onStartTimer, onPauseTimer, onStopTimer props removed from WinCard */}
            <WinCard
              win={win}
              onEdit={(newTitle) => onEdit?.(win.id, newTitle)}
              onDelete={() => onDelete?.(win.id)}
              onToggle={() => onToggle?.(win.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
