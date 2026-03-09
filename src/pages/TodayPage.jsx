import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLocalDateString } from '@/lib/utils/date';
import { useWins } from '@/hooks/useWins';
import { useCheckin } from '@/hooks/useCheckin';
import { useUIStore } from '@/stores/uiStore';
import WinList from '@/components/wins/WinList';
import WinInputOverlay from '@/components/wins/WinInputOverlay';
import RollForwardPrompt from '@/components/wins/RollForwardPrompt';
import TotalFocusTime from '@/components/wins/TotalFocusTime';
import MorningPrompt from '@/components/checkin/MorningPrompt';
import EveningPrompt from '@/components/checkin/EveningPrompt';
import CheckInOverlay from '@/components/checkin/CheckInOverlay';

export default function TodayPage() {
  const today = getLocalDateString();
  const currentHour = new Date().getHours();

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
    checkinOverlayOpen,
    morningDismissedDate,
    eveningDismissedDate,
    openCheckinOverlay,
    closeCheckinOverlay,
    dismissMorningPrompt,
    dismissEveningPrompt,
  } = useUIStore();

  const { hasCheckedInToday } = useCheckin();
  const [checkedInToday, setCheckedInToday] = useState(false);

  // After wins load, check if user has already done check-in today
  useEffect(() => {
    if (loading || wins.length === 0) return;
    let cancelled = false;
    const winIds = wins.map((w) => w.id);
    hasCheckedInToday(winIds).then((result) => {
      if (!cancelled) setCheckedInToday(result);
    });
    return () => { cancelled = true; };
  }, [loading, wins]);

  // Re-check checkedInToday when checkinOverlayOpen closes (after a check-in completes)
  useEffect(() => {
    if (checkinOverlayOpen || loading || wins.length === 0) return;
    const winIds = wins.map((w) => w.id);
    hasCheckedInToday(winIds).then((result) => setCheckedInToday(result));
  }, [checkinOverlayOpen]);

  const showRollForward = yesterdayWins.length > 0 && !rollForwardOffered;

  // Time-gated prompt visibility
  // Always guard on !loading to prevent false positives during fetch
  const showMorning = !loading
    && currentHour >= 9
    && wins.length === 0
    && morningDismissedDate !== today;

  const showEvening = !loading
    && currentHour >= 21
    && !checkedInToday
    && wins.length > 0
    && eveningDismissedDate !== today;

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

      {/* Loading / error / win list */}
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

      {/* Action buttons */}
      <div className="flex justify-center gap-3 pt-2">
        <button
          onClick={openInputOverlay}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-mono text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          aria-label="Log a win"
        >
          <Plus size={16} />
          Log a win
        </button>
        {wins.length > 0 && !checkedInToday && (
          <button
            onClick={openCheckinOverlay}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-mono text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            aria-label="Start check-in"
          >
            Check in
          </button>
        )}
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

      {/* Check-in overlay */}
      <CheckInOverlay
        open={checkinOverlayOpen}
        wins={wins}
        onComplete={() => {
          // hasCheckedInToday re-check happens via the useEffect watching checkinOverlayOpen
        }}
        onClose={closeCheckinOverlay}
      />

      {/* Morning prompt — 9am+ if no wins and not dismissed today */}
      <MorningPrompt
        show={showMorning}
        onLogWin={() => {
          dismissMorningPrompt();  // dismiss first — prevent overlap
          openInputOverlay();
        }}
        onDismiss={dismissMorningPrompt}
      />

      {/* Evening prompt — 9pm+ if no check-in and not dismissed today */}
      <EveningPrompt
        show={showEvening}
        onStartCheckin={() => {
          dismissEveningPrompt();   // dismiss first — prevent overlap
          openCheckinOverlay();
        }}
        onDismiss={dismissEveningPrompt}
      />
    </div>
  );
}
