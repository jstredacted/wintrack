import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useHistory } from '@/hooks/useHistory';
import { useIncomeConfig } from '@/hooks/useIncomeConfig';
import { supabase } from '@/lib/supabase';
import { USER_ID } from '@/lib/env';
import { formatUSD, formatPHP } from '@/lib/utils/currency';
import { getCurrentMonth } from '@/lib/utils/month';
import ConsistencyGraph from '@/components/history/ConsistencyGraph';
import CategoryRadar from '@/components/history/CategoryRadar';
import NotificationPermission from '@/components/NotificationPermission';
import IncomeSourceEditor from '@/components/finance/IncomeSourceEditor';
import { usePinStore } from '@/stores/pinStore';
import type { BillTemplate, RecurrenceType } from '@/types/finance';

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

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function recurrenceLabel(t: BillTemplate): string {
  switch (t.recurrence_type) {
    case 'one_time': return 'One-time';
    case 'recurring_n': return `Recurring (${t.recurrence_count} months)`;
    case 'recurring_until': return `Until ${t.recurrence_end}`;
    case 'ongoing': return 'Ongoing';
    default: return t.recurrence_type;
  }
}

const EMPTY_BILL_FORM = {
  name: '',
  amount: '',
  due_day: '',
  recurrence_type: 'ongoing' as RecurrenceType,
  recurrence_count: '',
  recurrence_end: '',
};

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
  const [pinPassword, setPinPassword] = useState('');
  const [pinPasswordError, setPinPasswordError] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  // Bill template state
  const [billTemplates, setBillTemplates] = useState<BillTemplate[]>([]);
  const [billsLoading, setBillsLoading] = useState(true);
  const [billEditingId, setBillEditingId] = useState<string | null>(null);
  const [billAddingNew, setBillAddingNew] = useState(false);
  const [billForm, setBillForm] = useState(EMPTY_BILL_FORM);
  const [billSaving, setBillSaving] = useState(false);
  const [billDeleteConfirm, setBillDeleteConfirm] = useState<string | null>(null);

  const fetchBillTemplates = useCallback(async () => {
    setBillsLoading(true);
    const { data } = await supabase
      .from('bill_templates')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('active', true)
      .order('due_day');
    setBillTemplates((data ?? []) as BillTemplate[]);
    setBillsLoading(false);
  }, []);

  useEffect(() => {
    fetchBillTemplates();
  }, [fetchBillTemplates]);

  function startEditBill(t: BillTemplate) {
    setBillEditingId(t.id);
    setBillForm({
      name: t.name,
      amount: String(t.amount),
      due_day: String(t.due_day),
      recurrence_type: t.recurrence_type,
      recurrence_count: t.recurrence_count ? String(t.recurrence_count) : '',
      recurrence_end: t.recurrence_end ?? '',
    });
  }

  function startAddBill() {
    setBillAddingNew(true);
    setBillForm({ ...EMPTY_BILL_FORM });
  }

  function cancelBillForm() {
    setBillEditingId(null);
    setBillAddingNew(false);
    setBillForm(EMPTY_BILL_FORM);
  }

  async function saveBillTemplate() {
    const name = billForm.name.trim();
    const amount = parseFloat(billForm.amount);
    const dueDay = parseInt(billForm.due_day, 10);
    if (!name || isNaN(amount) || isNaN(dueDay) || dueDay < 1 || dueDay > 31) return;

    setBillSaving(true);
    try {
      const row = {
        name,
        amount,
        due_day: dueDay,
        recurrence_type: billForm.recurrence_type,
        recurrence_count: billForm.recurrence_type === 'recurring_n' ? parseInt(billForm.recurrence_count, 10) || null : null,
        recurrence_end: billForm.recurrence_type === 'recurring_until' ? billForm.recurrence_end || null : null,
        start_month: getCurrentMonth(),
      };

      if (billEditingId) {
        await supabase.from('bill_templates').update(row).eq('id', billEditingId);
      } else {
        await supabase.from('bill_templates').insert({ ...row, user_id: USER_ID });
      }

      await fetchBillTemplates();
      cancelBillForm();
    } finally {
      setBillSaving(false);
    }
  }

  async function deleteBillTemplate(id: string) {
    await supabase.from('bill_templates').update({ active: false }).eq('id', id);
    setBillDeleteConfirm(null);
    await fetchBillTemplates();
  }

  const {
    sources,
    loading: incomeLoading,
    addSource,
    updateSource,
    removeSource,
  } = useIncomeConfig();

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

      {/* Security */}
      <div className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Security
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter the admin password to change your PIN.
        </p>
        <div className="flex gap-2 items-end max-w-sm">
          <input
            type="password"
            value={pinPassword}
            onChange={(e) => { setPinPassword(e.target.value); setPinPasswordError(false); }}
            placeholder="Admin password"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
          />
          <button
            onClick={async () => {
              if (pinPassword !== 'P4ssthew0rd') {
                setPinPasswordError(true);
                setPinPassword('');
                return;
              }
              setPinPassword('');
              await supabase.from('user_settings').update({ pin_hash: null }).eq('user_id', USER_ID);
              usePinStore.getState().setGateState('setup');
            }}
            className="font-mono text-sm uppercase tracking-widest border-b border-foreground pb-0.5 hover:opacity-70 transition-opacity whitespace-nowrap"
          >
            Change PIN
          </button>
        </div>
        {pinPasswordError && (
          <p className="text-sm font-mono text-destructive">Wrong password</p>
        )}
      </div>

      {/* Income Sources */}
      <div className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Income Sources
        </h2>
        {incomeLoading ? null : (
          <>
            {sources.map((source) => (
              <div
                key={source.id}
                className="bg-card border border-border rounded-[var(--radius)] p-4 space-y-3"
              >
                {editingId === source.id ? (
                  <IncomeSourceEditor
                    source={source}
                    onSave={async (data) => {
                      await updateSource(source.id, data);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                    onRemove={async (id) => {
                      await removeSource(id);
                      setEditingId(null);
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-foreground">
                        {source.name}
                      </span>
                      <span className="text-muted-foreground text-sm ml-2">
                        {source.currency === 'USD'
                          ? formatUSD(source.amount)
                          : formatPHP(source.amount)}
                        {source.conversion_method !== 'none' &&
                          ` via ${source.conversion_method}`}
                      </span>
                      {source.payday_day && (
                        <span className="text-muted-foreground text-xs ml-2">
                          Day {source.payday_day}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setEditingId(source.id)}
                      className="text-muted-foreground hover:text-foreground text-sm font-mono underline"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
            {addingNew ? (
              <IncomeSourceEditor
                onSave={async (data) => {
                  await addSource(data);
                  setAddingNew(false);
                }}
                onCancel={() => setAddingNew(false)}
              />
            ) : (
              <button
                onClick={() => setAddingNew(true)}
                className="text-muted-foreground hover:text-foreground text-[0.778rem] font-mono"
              >
                + Add Income Source
              </button>
            )}
          </>
        )}
      </div>

      {/* Bills */}
      <div className="space-y-4">
        <h2 className="font-mono text-[0.778rem] uppercase tracking-widest text-muted-foreground">
          BILLS
        </h2>
        {billsLoading ? null : (
          <>
            {billTemplates.map((t) => (
              <div key={t.id}>
                {billEditingId === t.id ? (
                  <BillTemplateForm
                    form={billForm}
                    setForm={setBillForm}
                    saving={billSaving}
                    onSave={saveBillTemplate}
                    onCancel={cancelBillForm}
                  />
                ) : billDeleteConfirm === t.id ? (
                  <div className="bg-card rounded-lg p-4 space-y-3">
                    <p className="text-[0.778rem] text-muted-foreground">
                      This will remove the bill template and all future unpaid instances. Paid instances are preserved.
                    </p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => deleteBillTemplate(t.id)}
                        className="text-destructive text-sm font-mono"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setBillDeleteConfirm(null)}
                        className="text-muted-foreground hover:text-foreground text-sm font-mono"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-card rounded-lg p-4 flex items-center gap-3">
                    <span className="text-base font-mono flex-1">{t.name}</span>
                    <span className="text-[1.333rem] font-mono tabular-nums">{formatPHP(t.amount)}</span>
                    <span className="text-[0.778rem] text-muted-foreground">Due {ordinal(t.due_day)}</span>
                    <span className="text-[0.778rem] text-muted-foreground">{recurrenceLabel(t)}</span>
                    <button
                      onClick={() => startEditBill(t)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Edit bill"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setBillDeleteConfirm(t.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Delete bill"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {billAddingNew ? (
              <BillTemplateForm
                form={billForm}
                setForm={setBillForm}
                saving={billSaving}
                onSave={saveBillTemplate}
                onCancel={cancelBillForm}
              />
            ) : (
              <button
                onClick={startAddBill}
                className="text-muted-foreground hover:text-foreground text-[0.778rem] font-mono"
              >
                + Add Bill Template
              </button>
            )}
          </>
        )}
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

// ---------- Bill Template Form ----------

interface BillTemplateFormProps {
  form: typeof EMPTY_BILL_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_BILL_FORM>>;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

function BillTemplateForm({ form, setForm, saving, onSave, onCancel }: BillTemplateFormProps) {
  const inputClass =
    'w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono';

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <div className="bg-card rounded-lg p-4 space-y-3" onKeyDown={handleKeyDown}>
      <input
        type="text"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        placeholder="Bill name"
        className={inputClass}
        autoFocus
      />
      <input
        type="number"
        value={form.amount}
        onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
        placeholder="Amount"
        step="0.01"
        className={inputClass}
      />
      <input
        type="number"
        value={form.due_day}
        onChange={(e) => setForm((f) => ({ ...f, due_day: e.target.value }))}
        placeholder="Due day (1-31)"
        min={1}
        max={31}
        className={inputClass}
      />
      <select
        value={form.recurrence_type}
        onChange={(e) => setForm((f) => ({ ...f, recurrence_type: e.target.value as RecurrenceType }))}
        className={inputClass}
      >
        <option value="one_time">One-time</option>
        <option value="recurring_n">Recurring for N months</option>
        <option value="recurring_until">Recurring until date</option>
        <option value="ongoing">Ongoing</option>
      </select>
      {form.recurrence_type === 'recurring_n' && (
        <input
          type="number"
          value={form.recurrence_count}
          onChange={(e) => setForm((f) => ({ ...f, recurrence_count: e.target.value }))}
          placeholder="Number of months"
          min={1}
          className={inputClass}
        />
      )}
      {form.recurrence_type === 'recurring_until' && (
        <input
          type="text"
          value={form.recurrence_end}
          onChange={(e) => setForm((f) => ({ ...f, recurrence_end: e.target.value }))}
          placeholder="End month (YYYY-MM)"
          className={inputClass}
        />
      )}
      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={onSave}
          disabled={saving || !form.name.trim() || !form.amount}
          className="font-mono text-sm uppercase tracking-widest border-b border-foreground pb-0.5 hover:opacity-70 transition-opacity disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground text-sm font-mono"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
