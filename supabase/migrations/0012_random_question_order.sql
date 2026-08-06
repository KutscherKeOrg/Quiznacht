-- ============================================================
-- QUIZNACHT – Migration 0012: Zufällige Fragenreihenfolge pro Raum
-- Nach 0001–0011 ausführen.
-- ============================================================
-- Jeder Raum bekommt beim Erstellen (und bei "Nochmal spielen") eine neu
-- gemischte Reihenfolge der Frage-IDs seines Quiz, gespeichert hier. Die
-- Verwaltungsreihenfolge (quiz_questions.order_index) bleibt davon
-- unberührt und bestimmt weiterhin nur die Anzeige in "Fragen zusammenstellen".

alter table rooms add column if not exists question_order uuid[] not null default '{}';
