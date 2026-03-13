-- Phase 04-01: User settings table
CREATE TABLE user_settings (
  user_id    uuid PRIMARY KEY DEFAULT auth.uid(),
  day_start_hour      int NOT NULL DEFAULT 0 CHECK (day_start_hour BETWEEN 0 AND 6),
  morning_prompt_hour  int NOT NULL DEFAULT 9 CHECK (morning_prompt_hour BETWEEN 5 AND 14),
  evening_prompt_hour  int NOT NULL DEFAULT 21 CHECK (evening_prompt_hour BETWEEN 17 AND 23),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own settings"
  ON user_settings FOR SELECT
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid)
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);
