-- 016: EF SET の受検間隔（ヶ月）
-- Run this in the Supabase SQL editor (schema: nativego)
--
-- EF SET を何ヶ月に1回受けるか。デフォルト3ヶ月。
-- 前回受検から interval ヶ月経過したら、トップページに受検バナーを出す。

ALTER TABLE nativego.user_settings
  ADD COLUMN IF NOT EXISTS ef_set_interval_months int NOT NULL DEFAULT 3;
