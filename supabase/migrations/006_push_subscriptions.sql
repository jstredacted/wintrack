-- Push notification subscriptions (Web Push API)
-- Stores the push subscription per user so the server-side Edge Function
-- can send notifications via the Web Push protocol.

CREATE TABLE push_subscriptions (
  user_id         uuid          PRIMARY KEY,
  endpoint        text          NOT NULL,
  p256dh          text          NOT NULL,
  auth            text          NOT NULL,
  expiration_time timestamptz,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies: same pattern as wins / check_ins / journal_entries
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);

CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);

CREATE POLICY "Users can update own push subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid)
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);
