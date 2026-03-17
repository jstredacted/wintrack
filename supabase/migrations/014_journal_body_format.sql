ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS body_format text NOT NULL DEFAULT 'plaintext';
