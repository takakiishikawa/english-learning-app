-- 005: category column for grammar (parallel to expressions.category)
-- Run this in the Supabase SQL editor (schema: nativego)

ALTER TABLE nativego.grammar
  ADD COLUMN IF NOT EXISTS category text;
