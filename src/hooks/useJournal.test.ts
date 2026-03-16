import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useJournal } from './useJournal';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) => resolve({ data: [], error: null })),
    catch: vi.fn().mockReturnThis(),
  },
}));

// JOURNAL-01: useJournal initial state, addEntry
// JOURNAL-02: editEntry, deleteEntry
// Wave 0 stub — all tests fail with module-not-found until Wave 1 creates useJournal.js

/**
 * buildJournalMock(resolvedValue)
 *
 * Creates a chainable Supabase query mock that supports:
 *   supabase.from('journal_entries').select(...).eq(...).order(...)
 *   supabase.from('journal_entries').insert(...).select().single()
 *   supabase.from('journal_entries').update(...).eq(...).eq(...)
 *   supabase.from('journal_entries').delete().eq(...).eq(...)
 *
 * The mock object is thenable so it can be awaited at any point in the chain.
 */
function buildJournalMock(resolvedValue) {
  const mock = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    single: vi.fn(),
    then: (resolve) => Promise.resolve(resolvedValue).then(resolve),
    catch: (reject) => Promise.resolve(resolvedValue).catch(reject),
  };
  mock.select.mockReturnValue(mock);
  mock.eq.mockReturnValue(mock);
  mock.order.mockReturnValue(mock);
  mock.insert.mockReturnValue(mock);
  mock.update.mockReturnValue(mock);
  mock.delete.mockReturnValue(mock);
  mock.single.mockReturnValue(mock);
  return mock;
}

describe('useJournal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with entries=[] and loading=true then loading=false after fetch', async () => {
      const { supabase } = await import('@/lib/supabase');
      supabase.from.mockReturnValue(buildJournalMock({ data: [], error: null }));

      const { result } = renderHook(() => useJournal());

      // loading should become false after fetch resolves
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.entries).toEqual([]);
    });

    it('populates entries from fetched data', async () => {
      const mockEntries = [
        { id: 'entry-1', title: 'Day one', body: 'It went well.', created_at: '2026-03-09T10:00:00Z', updated_at: '2026-03-09T10:00:00Z' },
      ];
      const { supabase } = await import('@/lib/supabase');
      supabase.from.mockReturnValue(buildJournalMock({ data: mockEntries, error: null }));

      const { result } = renderHook(() => useJournal());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.entries).toHaveLength(1);
      expect(result.current.entries[0].title).toBe('Day one');
    });
  });

  describe('addEntry', () => {
    it('calls supabase.from("journal_entries").insert with { user_id, title, body }', async () => {
      const { supabase } = await import('@/lib/supabase');
      const fetchMock = buildJournalMock({ data: [], error: null });
      const insertMock = buildJournalMock({
        data: { id: 'entry-new', title: 'New Entry', body: 'Content here.', created_at: '2026-03-10T08:00:00Z', updated_at: '2026-03-10T08:00:00Z' },
        error: null,
      });
      // first call is the initial fetch, second is the insert
      supabase.from.mockReturnValueOnce(fetchMock).mockReturnValueOnce(insertMock);

      const { result } = renderHook(() => useJournal());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.addEntry({ title: 'New Entry', body: 'Content here.' });
      });

      expect(insertMock.insert).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New Entry', body: 'Content here.' })
      );
    });

    it('adds returned row to entries state after successful insert', async () => {
      const { supabase } = await import('@/lib/supabase');
      const newEntry = { id: 'entry-new', title: 'New Entry', body: 'Content here.', created_at: '2026-03-10T08:00:00Z', updated_at: '2026-03-10T08:00:00Z' };
      const fetchMock = buildJournalMock({ data: [], error: null });
      const insertMock = buildJournalMock({ data: newEntry, error: null });
      supabase.from.mockReturnValueOnce(fetchMock).mockReturnValueOnce(insertMock);

      const { result } = renderHook(() => useJournal());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.addEntry({ title: 'New Entry', body: 'Content here.' });
      });

      expect(result.current.entries).toHaveLength(1);
      expect(result.current.entries[0].id).toBe('entry-new');
    });
  });

  describe('editEntry', () => {
    it('calls supabase.update with { title, body, updated_at } including updated_at ISO string', async () => {
      const existingEntry = { id: 'entry-1', title: 'Old Title', body: 'Old body.', created_at: '2026-03-09T10:00:00Z', updated_at: '2026-03-09T10:00:00Z' };
      const { supabase } = await import('@/lib/supabase');
      const fetchMock = buildJournalMock({ data: [existingEntry], error: null });
      const updateMock = buildJournalMock({ error: null });
      supabase.from.mockReturnValueOnce(fetchMock).mockReturnValueOnce(updateMock);

      const { result } = renderHook(() => useJournal());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.editEntry('entry-1', { title: 'Updated Title', body: 'Updated body.' });
      });

      expect(updateMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title',
          body: 'Updated body.',
          updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        })
      );
    });

    it('updates entry in state optimistically (does not wait for Supabase response)', async () => {
      const existingEntry = { id: 'entry-1', title: 'Old Title', body: 'Old body.', created_at: '2026-03-09T10:00:00Z', updated_at: '2026-03-09T10:00:00Z' };
      const { supabase } = await import('@/lib/supabase');
      const fetchMock = buildJournalMock({ data: [existingEntry], error: null });
      const updateMock = buildJournalMock({ error: null });
      supabase.from.mockReturnValueOnce(fetchMock).mockReturnValueOnce(updateMock);

      const { result } = renderHook(() => useJournal());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.editEntry('entry-1', { title: 'Updated Title', body: 'Updated body.' });
      });

      const updated = result.current.entries.find(e => e.id === 'entry-1');
      expect(updated.title).toBe('Updated Title');
      expect(updated.body).toBe('Updated body.');
    });
  });

  describe('deleteEntry', () => {
    it('calls supabase.delete().eq("id", id) to remove entry', async () => {
      const existingEntry = { id: 'entry-1', title: 'Day one', body: 'Content.', created_at: '2026-03-09T10:00:00Z', updated_at: '2026-03-09T10:00:00Z' };
      const { supabase } = await import('@/lib/supabase');
      const fetchMock = buildJournalMock({ data: [existingEntry], error: null });
      const deleteMock = buildJournalMock({ error: null });
      supabase.from.mockReturnValueOnce(fetchMock).mockReturnValueOnce(deleteMock);

      const { result } = renderHook(() => useJournal());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteEntry('entry-1');
      });

      expect(deleteMock.delete).toHaveBeenCalled();
    });

    it('removes entry from entries state after delete', async () => {
      const existingEntry = { id: 'entry-1', title: 'Day one', body: 'Content.', created_at: '2026-03-09T10:00:00Z', updated_at: '2026-03-09T10:00:00Z' };
      const { supabase } = await import('@/lib/supabase');
      const fetchMock = buildJournalMock({ data: [existingEntry], error: null });
      const deleteMock = buildJournalMock({ error: null });
      supabase.from.mockReturnValueOnce(fetchMock).mockReturnValueOnce(deleteMock);

      const { result } = renderHook(() => useJournal());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteEntry('entry-1');
      });

      expect(result.current.entries).toHaveLength(0);
    });
  });
});
