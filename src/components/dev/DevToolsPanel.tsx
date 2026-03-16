import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { USER_ID } from '@/lib/env';
import { getLocalDateString } from '@/lib/utils/date';

interface DevToolsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function DevToolsPanel({ open, onClose }: DevToolsPanelProps) {
  if (!open) return null;

  async function seedTodayWins(count = 3) {
    const today = getLocalDateString();
    const wins = Array.from({ length: count }, (_, i) => ({
      user_id: USER_ID,
      title: `Dev win ${i + 1}`,
      win_date: today,
    }));
    await supabase.from('wins').insert(wins);
    onClose();
    window.location.reload();
  }

  async function seedYesterdayComplete() {
    const yesterday = getLocalDateString(new Date(Date.now() - 86400000));
    const wins = Array.from({ length: 3 }, (_, i) => ({
      user_id: USER_ID,
      title: `Dev win ${i + 1}`,
      win_date: yesterday,
      completed: true,
    }));
    await supabase.from('wins').insert(wins);
    onClose();
    window.location.reload();
  }

  async function seedJournalEntry() {
    const today = getLocalDateString();
    await supabase.from('journal_entries').insert({
      user_id: USER_ID,
      title: 'Dev journal entry',
      body: 'Test body content for development.',
      category: 'daily',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    onClose();
    window.location.reload();
  }

  async function clearToday() {
    const today = getLocalDateString();
    // Delete wins for today (cascade handles check_ins via FK)
    await supabase
      .from('wins')
      .delete()
      .eq('user_id', USER_ID)
      .eq('win_date', today);
    // Delete journal entries created today
    const todayStart = `${today}T00:00:00.000Z`;
    const todayEnd = `${today}T23:59:59.999Z`;
    await supabase
      .from('journal_entries')
      .delete()
      .eq('user_id', USER_ID)
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd);
    onClose();
    window.location.reload();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="border border-border p-8 flex flex-col gap-3 font-mono text-sm min-w-[320px] bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Dev Tools
        </p>
        <button
          onClick={() => seedTodayWins(3)}
          className="text-left hover:text-foreground text-muted-foreground py-1"
        >
          Seed 3 wins (today)
        </button>
        <button
          onClick={() => seedYesterdayComplete()}
          className="text-left hover:text-foreground text-muted-foreground py-1"
        >
          Seed yesterday complete (streak)
        </button>
        <button
          onClick={() => seedJournalEntry()}
          className="text-left hover:text-foreground text-muted-foreground py-1"
        >
          Seed journal entry
        </button>
        <hr className="border-border" />
        <button
          onClick={() => clearToday()}
          className="text-left hover:text-destructive text-muted-foreground py-1"
        >
          Clear today's data
        </button>
        <hr className="border-border" />
        <button
          onClick={onClose}
          className="text-left text-muted-foreground/40 py-1 text-xs"
        >
          Close (Ctrl+Shift+D)
        </button>
      </div>
    </div>,
    document.body,
  );
}
