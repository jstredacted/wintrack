import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLocalDateString } from '@/lib/utils/date';
import { useWins } from '@/hooks/useWins';
import { useUIStore } from '@/stores/uiStore';
import WinList from '@/components/wins/WinList';
import WinInputOverlay from '@/components/wins/WinInputOverlay';
import RollForwardPrompt from '@/components/wins/RollForwardPrompt';
import TotalFocusTime from '@/components/wins/TotalFocusTime';

export default function TodayPage() {
  const today = getLocalDateString();

  const {
    wins,
    loading,
    error,
    yesterdayWins,
    addWin,
    editWin,
    deleteWin,
    rollForward,
    startTimer,
    pauseTimer,
    stopTimer,
  } = useWins();

  const {
    inputOverlayOpen,
    rollForwardOffered,
    openInputOverlay,
    closeInputOverlay,
    markRollForwardOffered,
  } = useUIStore();

  const showRollForward = yesterdayWins.length > 0 && !rollForwardOffered;

  return (
    <div className="flex flex-col min-h-[calc(100svh-7rem)] p-6 gap-4">
      {/* Date header */}
      <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground text-center">
        {today}
      </p>

      {/* Roll-forward prompt */}
      {showRollForward && (
        <RollForwardPrompt
          count={yesterdayWins.length}
          onConfirm={async () => {
            await rollForward();
            markRollForwardOffered();
          }}
          onDismiss={markRollForwardOffered}
        />
      )}

      {/* Total focus time */}
      <div className="flex justify-center">
        <TotalFocusTime wins={wins} />
      </div>

      {/* Loading / error states */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.p
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-xs font-mono text-muted-foreground text-center"
          >
            Loading…
          </motion.p>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {error && (
              <p className="text-xs font-mono text-destructive text-center mb-4">
                {error}
              </p>
            )}
            <WinList
              wins={wins}
              onEdit={(id, newTitle) => editWin(id, newTitle)}
              onDelete={(id) => deleteWin(id)}
              onStartTimer={(id) => startTimer(id)}
              onPauseTimer={(id, secs) => pauseTimer(id, secs)}
              onStopTimer={(id, secs) => stopTimer(id, secs)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log a win button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={openInputOverlay}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-mono text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          aria-label="Log a win"
        >
          <Plus size={16} />
          Log a win
        </button>
      </div>

      {/* Win input overlay */}
      <WinInputOverlay
        open={inputOverlayOpen}
        onSubmit={async (title) => {
          await addWin(title);
          closeInputOverlay();
        }}
        onClose={closeInputOverlay}
      />
    </div>
  );
}
