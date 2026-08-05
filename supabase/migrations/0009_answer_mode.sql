-- ============================================================
-- QUIZNACHT – Migration 0009: Antwortmodus (offen/Auswahl) je Frage
-- Nach 0001–0008 ausführen.
-- ============================================================
-- Bisher war der Antwortmodus fix an den Fragetyp gekoppelt (Portrait
-- erraten = offene Eingabe, Rest = A–D-Auswahl). Jetzt ist das pro Frage
-- wählbar. Bestehende Fragen behalten ihr bisheriges Verhalten:
-- Portrait-Fragen -> 'open', alle anderen -> Standard 'choice'.

alter table questions add column if not exists answer_mode text not null default 'choice';

alter table questions drop constraint if exists questions_answer_mode_check;
alter table questions add constraint questions_answer_mode_check check (answer_mode in ('open', 'choice'));

update questions set answer_mode = 'open' where type = 'portrait';
