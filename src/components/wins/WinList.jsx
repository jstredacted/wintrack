import { AnimatePresence, motion } from 'motion/react';
import WinCard from './WinCard';

/**
 * WinList
 *
 * Props:
 *   wins: array of win objects
 *   onEdit(winId, newTitle)     — called when a win title is edited
 *   onDelete(winId)             — called when a win is deleted
 *   onStartTimer(winId)         — called when timer is started
 *   onPauseTimer(winId, secs)   — called when timer is paused
 *   onStopTimer(winId, secs)    — called when timer is stopped
 */
export default function WinList({
  wins = [],
  onEdit,
  onDelete,
  onStartTimer,
  onPauseTimer,
  onStopTimer,
}) {
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
            <WinCard
              win={win}
              onEdit={(newTitle) => onEdit?.(win.id, newTitle)}
              onDelete={() => onDelete?.(win.id)}
              onStartTimer={() => onStartTimer?.(win.id)}
              onPauseTimer={(secs) => onPauseTimer?.(win.id, secs)}
              onStopTimer={(secs) => onStopTimer?.(win.id, secs)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
