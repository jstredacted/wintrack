import { useState, useEffect } from 'react';
// STOPWATCH REMOVED — useRef kept for potential re-enable: import { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLocalDateString } from '@/lib/utils/date';
import { useWins } from '@/hooks/useWins';
import { useCheckin } from '@/hooks/useCheckin';
import { useUIStore } from '@/stores/uiStore';
import WinList from '@/components/wins/WinList';
import CategorySummary from '@/components/wins/CategorySummary';
import WinInputOverlay from '@/components/wins/WinInputOverlay';
import RollForwardPrompt from '@/components/wins/RollForwardPrompt';
// STOPWATCH REMOVED — TotalFocusTime import kept for potential re-enable
// import TotalFocusTime from '@/components/wins/TotalFocusTime';
import MorningPrompt from '@/components/checkin/MorningPrompt';
import EveningPrompt from '@/components/checkin/EveningPrompt';
import CheckInOverlay from '@/components/checkin/CheckInOverlay';
// STOPWATCH REMOVED — TimerFocusOverlay import kept for potential re-enable
// import TimerFocusOverlay from '@/components/wins/TimerFocusOverlay';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

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
    toggleWinCompleted,
    // STOPWATCH REMOVED — startTimer, pauseTimer, stopTimer,
  } = useWins();

  const {
    inputOverlayOpen,
    rollForwardOfferedDate,
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
    // STOPWATCH REMOVED — timerOverlayOpen, openTimerOverlay, closeTimerOverlay,
    refreshStreak,
  } = useUIStore();

  // STOPWATCH REMOVED — openedFromTimerRef kept for potential re-enable
  // const openedFromTimerRef = useRef(false);
  const { hasCheckedInToday } = useCheckin();
  const [checkedInToday, setCheckedInToday] = useState(null);

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

  const showRollForward = yesterdayWins.length > 0 && rollForwardOfferedDate !== today;

  // Time-gated prompt visibility
  // Always guard on !loading to prevent false positives during fetch
  const showMorning = !loading
    && currentHour >= 9
    && wins.length === 0
    && morningDismissedDate !== today;

  const showEvening = !loading
    && checkedInToday === false
    && currentHour >= 21
    && wins.length > 0
    && eveningDismissedDate !== today;

  return (
    <div className="flex flex-col min-h-svh px-16 py-12 gap-10">

      {/* Commanding greeting header */}
      <div>
        <h1 className="text-5xl font-bold leading-none tracking-tight">
          {getGreeting()}
        </h1>
        <p className="font-mono text-lg text-muted-foreground mt-3 tracking-[0.1em] uppercase">
          {today}
        </p>
        {/* STOPWATCH REMOVED — TotalFocusTime display
        <div className="mt-2">
          <TotalFocusTime wins={wins} />
        </div>
        */}
      </div>

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

      {/* Loading / error / win list */}
      <div className="flex-1">
        <AnimatePresence>
          {loading ? (
            <motion.p
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-sm font-mono text-muted-foreground"
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
                <p className="text-sm font-mono text-destructive mb-6">
                  {error}
                </p>
              )}
              {/* STOPWATCH REMOVED — onStartTimer, onPauseTimer, onStopTimer props removed */}
              <WinList
                wins={wins}
                onEdit={(id, newTitle) => editWin(id, newTitle)}
                onDelete={(id) => deleteWin(id)}
                onToggle={(id) => toggleWinCompleted(id)}
              />
              {wins.length > 0 && (
                <div className="mt-4">
                  <CategorySummary wins={wins} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-4 pb-2 mt-auto">
        <button
          onClick={openInputOverlay}
          className="flex items-center gap-2 px-5 py-3 border border-border font-mono text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors active:scale-[0.96] transition-transform duration-75"
          aria-label="Set intentions"
        >
          <Plus size={16} />
          Set intentions
        </button>
        {wins.length > 0 && !checkedInToday && (
          <button
            onClick={openCheckinOverlay}
            className="flex items-center gap-2 px-5 py-3 border border-border font-mono text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors active:scale-[0.96] transition-transform duration-75"
            aria-label="Start check-in"
          >
            Check in
          </button>
        )}
      </div>

      {/* Win input overlay */}
      <WinInputOverlay
        open={inputOverlayOpen}
        onSubmit={async (title, category) => {
          await addWin(title, category);
          // STOPWATCH REMOVED — timer start after win add
          // if (openedFromTimerRef.current && newWin) {
          //   openedFromTimerRef.current = false;
          //   startTimer(newWin.id);
          //   openTimerOverlay();
          // }
        }}
        onDone={closeInputOverlay}
        onClose={closeInputOverlay}
      />

      {/* Check-in overlay */}
      <CheckInOverlay
        open={checkinOverlayOpen}
        wins={wins}
        onComplete={() => {
          refreshStreak();
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

      {/* STOPWATCH REMOVED — TimerFocusOverlay JSX block
      <TimerFocusOverlay
        open={timerOverlayOpen}
        wins={wins}
        onClose={closeTimerOverlay}
        onStopAll={() => {
          wins.forEach((win) => {
            if (win.timer_started_at) {
              const elapsed = (win.timer_elapsed_seconds ?? 0) +
                Math.floor((Date.now() - new Date(win.timer_started_at).getTime()) / 1000);
              stopTimer(win.id, elapsed);
            }
          });
          closeTimerOverlay();
        }}
        onAddWin={() => {
          openedFromTimerRef.current = true;
          closeTimerOverlay();
          openInputOverlay();
        }}
        onStartWin={(id) => startTimer(id)}
        onPauseWin={(id, displaySeconds) => pauseTimer(id, displaySeconds)}
        onStopWin={(id, displaySeconds) => {
          stopTimer(id, displaySeconds);
          const remaining = wins.filter(w => w.id !== id && w.timer_started_at);
          if (remaining.length === 0) closeTimerOverlay();
        }}
      />
      */}
    </div>
  );
}
