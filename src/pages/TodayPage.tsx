import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLocalDateString } from '@/lib/utils/date';
import { useWins } from '@/hooks/useWins';
import { useHistory } from '@/hooks/useHistory';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import WinList from '@/components/wins/WinList';
import CategorySummary from '@/components/wins/CategorySummary';
import WinInputOverlay from '@/components/wins/WinInputOverlay';
import RollForwardPrompt from '@/components/wins/RollForwardPrompt';
import DayStrip from '@/components/history/DayStrip';
import DayDetail from '@/components/history/DayDetail';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const pastDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export default function TodayPage() {
  const { dayStartHour } = useSettingsStore(s => s.settings);
  const today = getLocalDateString(new Date(), dayStartHour);

  const [selectedDate, setSelectedDate] = useState(() => today);
  const isToday = selectedDate === today;

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
  } = useWins();

  const { completionMap, fetchWinsForDate } = useHistory();

  const {
    inputOverlayOpen,
    rollForwardOfferedDate,
    openInputOverlay,
    closeInputOverlay,
    markRollForwardOffered,
    refreshStreak,
  } = useUIStore();

  // Past-date wins state
  const [historyWins, setHistoryWins] = useState<Array<{ id: string; title: string; category: string; completed: boolean }>>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch wins when viewing a past date
  useEffect(() => {
    if (isToday) return;
    let cancelled = false;
    setDetailLoading(true);
    fetchWinsForDate(selectedDate).then(data => {
      if (!cancelled) { setHistoryWins(data); setDetailLoading(false); }
    });
    return () => { cancelled = true; };
  }, [selectedDate, isToday, fetchWinsForDate]);

  // Merge today's live completion state into the history completionMap
  const todayCompleted = wins.filter(w => w.completed).length;
  const mergedCompletionMap = {
    ...completionMap,
    ...(wins.length > 0 ? { [today]: { completed: todayCompleted, total: wins.length } } : {}),
  };

  const showRollForward = isToday && yesterdayWins.length > 0 && rollForwardOfferedDate !== today;

  return (
    <div className="flex flex-col min-h-svh px-16 py-12 gap-10">

      {/* Fixed header — greeting + date + DayStrip stay pinned */}
      <div>
        <p className="text-lg text-muted-foreground mb-2">
          {getGreeting()}
        </p>
        <h1 className="text-5xl font-bold leading-none tracking-tight">
          {pastDateFormatter.format(new Date(selectedDate + 'T12:00:00'))}
        </h1>
      </div>

      {/* DayStrip -- always mounted, edge-to-edge bleed */}
      <div className="mb-0 -mx-16 px-16 border-y border-border/30 py-4 -mt-4">
        <DayStrip
          completionMap={mergedCompletionMap}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          days={28}
        />
      </div>

      {isToday ? (
        <>
          {/* Roll-forward prompt */}
          {showRollForward && (
            <RollForwardPrompt
              count={yesterdayWins.length}
              onConfirm={async () => {
                await rollForward();
                markRollForwardOffered(dayStartHour);
              }}
              onDismiss={() => markRollForwardOffered(dayStartHour)}
            />
          )}

          {/* Loading / error / win list */}
          <div className="flex-1 pb-24">
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
                  <WinList
                    wins={wins}
                    onEdit={(id, newTitle) => editWin(id, newTitle)}
                    onDelete={(id) => deleteWin(id)}
                    onToggle={async (id) => { await toggleWinCompleted(id); refreshStreak(); }}
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

          {/* FAB — Set intentions */}
          <button
            onClick={openInputOverlay}
            aria-label="Set intentions"
            className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-foreground text-background shadow-sm hover:scale-105 active:scale-95 transition-transform duration-100"
          >
            <Plus size={24} strokeWidth={1.5} />
          </button>

          {/* Win input overlay */}
          <WinInputOverlay
            open={inputOverlayOpen}
            onSubmit={async (title, category) => {
              await addWin(title, category);
            }}
            onDone={closeInputOverlay}
            onClose={closeInputOverlay}
          />
        </>
      ) : (
        /* Past date -- read-only DayDetail */
        <AnimatePresence>
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <DayDetail date={selectedDate} wins={historyWins} loading={detailLoading} />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
