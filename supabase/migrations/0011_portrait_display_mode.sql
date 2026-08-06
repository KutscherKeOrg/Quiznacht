-- ============================================================
-- QUIZNACHT – Migration 0011: Anzeigemodus für Portrait-Fragen
-- Nach 0001–0010 ausführen.
-- ============================================================
-- 'blur' (Standard) = Bild wird beim Spielen stufenweise aufgedeckt.
-- 'sharp' = Bild wird sofort unverpixelt gezeigt, keine Aufdeck-Mechanik.

alter table questions add column if not exists portrait_display_mode text not null default 'blur';

alter table questions drop constraint if exists questions_portrait_display_mode_check;
alter table questions add constraint questions_portrait_display_mode_check
  check (portrait_display_mode in ('blur', 'sharp'));
