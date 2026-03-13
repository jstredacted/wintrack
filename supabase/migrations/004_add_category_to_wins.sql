ALTER TABLE wins
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'work'
    CHECK (category IN ('work', 'personal', 'health'));
