-- ============================================================
-- QUIZNACHT – Migration 0007: Antwortzeit-Sperre für Räume
-- Nach 0006 ausführen.
-- ============================================================
-- Neues Moderator-Werkzeug "Antwortzeit beenden": sperrt neue Antworten,
-- ohne schon aufzulösen. Getrennt von `revealed`, damit beide Schritte
-- unabhängig voneinander steuerbar sind.

alter table rooms add column if not exists locked boolean not null default false;
