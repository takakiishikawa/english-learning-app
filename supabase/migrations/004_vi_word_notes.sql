-- 004: word_notes / nuance for Vietnamese mode
-- Run this in the Supabase SQL editor (schema: nativego)

-- 1. word_notes (per-word简易解説) on both grammar and expressions
--    Format: jsonb array [{ "word": "không", "note": "～しない（否定）" }, ...]
--    Always nullable; English records stay null.
ALTER TABLE nativego.grammar
  ADD COLUMN IF NOT EXISTS word_notes jsonb;
ALTER TABLE nativego.expressions
  ADD COLUMN IF NOT EXISTS word_notes jsonb;

-- 2. nuance (短い「相手にどう伝わるか」の補足) — expressions only
ALTER TABLE nativego.expressions
  ADD COLUMN IF NOT EXISTS nuance text;
