import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { supabase } from '@/lib/supabase';
import { USER_ID } from '@/lib/env';

const DEFAULTS = {
  dayStartHour: 0,
  morningPromptHour: 9,
  eveningPromptHour: 21,
};

function toStoreShape(row) {
  return {
    dayStartHour: row.day_start_hour,
    morningPromptHour: row.morning_prompt_hour,
    eveningPromptHour: row.evening_prompt_hour,
  };
}

function toDbShape(settings) {
  return {
    user_id: USER_ID,
    day_start_hour: settings.dayStartHour,
    morning_prompt_hour: settings.morningPromptHour,
    evening_prompt_hour: settings.eveningPromptHour,
    updated_at: new Date().toISOString(),
  };
}

export function useSettings() {
  const settings = useSettingsStore((s) => s.settings);
  const setSettings = useSettingsStore((s) => s.setSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from('user_settings')
        .select('day_start_hour, morning_prompt_hour, evening_prompt_hour')
        .eq('user_id', USER_ID)
        .single();

      if (cancelled) return;

      if (data) {
        setSettings(toStoreShape(data));
      } else {
        // No row exists — upsert defaults
        await supabase
          .from('user_settings')
          .upsert(toDbShape(DEFAULTS));
        if (!cancelled) setSettings({ ...DEFAULTS });
      }

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveSettings(partial) {
    const merged = { ...settings, ...partial };
    setSettings(merged);
    await supabase
      .from('user_settings')
      .upsert(toDbShape(merged));
  }

  return { settings, loading, saveSettings };
}
