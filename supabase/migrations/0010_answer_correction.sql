-- ============================================================
-- QUIZNACHT – Migration 0010: Nachträgliche Korrektur von Antworten
-- Nach 0001–0009 ausführen.
-- ============================================================
-- Der Host kann eine einzelne Antwort manuell als richtig/falsch
-- markieren, unabhängig vom automatischen Abgleich (z.B. Tippfehler).
-- null = automatischer Abgleich gilt, true/false = manuelle Übersteuerung.

alter table answers add column if not exists correct_override boolean;
