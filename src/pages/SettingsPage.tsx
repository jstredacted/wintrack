import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useHistory } from '@/hooks/useHistory';
import { supabase } from '@/lib/supabase';
import { USER_ID } from '@/lib/env';
import ConsistencyGraph from '@/components/history/ConsistencyGraph';
import CategoryRadar from '@/components/history/CategoryRadar';
import NotificationPermission from '@/components/NotificationPermission';

const DAY_START_OPTIONS = [
  { value: 0, label: 'Midnight' },
  { value: 1, label: '1:00 AM' },
  { value: 2, label: '2:00 AM' },
  { value: 3, label: '3:00 AM' },
  { value: 4, label: '4:00 AM' },
  { value: 5, label: '5:00 AM' },
  { value: 6, label: '6:00 AM' },
];

const MORNING_HOURS = Array.from({ length: 10 }, (_, i) => {
  const h = i + 5;
  const suffix = h < 12 ? 'AM' : 'PM';
  const display = h <= 12 ? h : h - 12;
  return { value: h, label: `${display}:00 ${suffix}` };
});

const EVENING_HOURS = Array.from({ length: 7 }, (_, i) => {
  const h = i + 17;
  const display = h <= 12 ? h : h - 12;
  return { value: h, label: `${display}:00 PM` };
});

export default function SettingsPage() {
  const { settings, loading, saveSettings } = useSettings();
  const { completionMap } = useHistory();
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [form, setForm] = useState({
    dayStartHour: 0,
    morningPromptHour: 9,
    eveningPromptHour: 21,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading) {
      setForm({
        dayStartHour: settings.dayStartHour,
        morningPromptHour: settings.morningPromptHour,
        eveningPromptHour: settings.eveningPromptHour,
      });
    }
  }, [loading, settings]);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('wins')
        .select('category')
        .eq('user_id', USER_ID)
        .eq('completed', true);
      if (!data) return;
      const counts: Record<string, number> = {};
      for (const { category } of data) {
        if (category) counts[category] = (counts[category] || 0) + 1;
      }
      setCategoryCounts(counts);
    }
    fetchCategories();
  }, []);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: parseInt(value, 10) }));
  }

  async function handleSave() {
    await saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return null;

  return (
    <div className="px-6 sm:px-16 py-12 space-y-12">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      {/* Settings Form */}
      <div className="space-y-6 max-w-sm">
        <div className="space-y-2">
          <label
            htmlFor="dayStartHour"
            className="block font-mono text-xs uppercase tracking-widest text-muted-foreground"
          >
            Day Start Hour
          </label>
          <select
            id="dayStartHour"
            value={form.dayStartHour}
            onChange={(e) => handleChange('dayStartHour', e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
          >
            {DAY_START_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="morningPromptHour"
            className="block font-mono text-xs uppercase tracking-widest text-muted-foreground"
          >
            Morning Prompt Hour
          </label>
          <select
            id="morningPromptHour"
            value={form.morningPromptHour}
            onChange={(e) => handleChange('morningPromptHour', e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
          >
            {MORNING_HOURS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="eveningPromptHour"
            className="block font-mono text-xs uppercase tracking-widest text-muted-foreground"
          >
            Evening Prompt Hour
          </label>
          <select
            id="eveningPromptHour"
            value={form.eveningPromptHour}
            onChange={(e) => handleChange('eveningPromptHour', e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
          >
            {EVENING_HOURS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSave}
          className="font-mono text-sm uppercase tracking-widest border-b border-foreground pb-0.5 hover:opacity-70 transition-opacity"
        >
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Notifications
        </h2>
        <p className="text-sm text-muted-foreground">
          Receive push reminders at your configured morning and evening hours.
        </p>
        <NotificationPermission />
      </div>

      {/* Consistency Heatmap */}
      <div className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Consistency
        </h2>
        <ConsistencyGraph
          completionMap={completionMap}
          dayStartHour={form.dayStartHour}
        />
      </div>

      {/* Category Radar */}
      <div className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Categories
        </h2>
        <CategoryRadar categoryCounts={categoryCounts} />
      </div>
    </div>
  );
}
