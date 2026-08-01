-- ============================================================
-- QUIZNACHT – Migration 0003 (optional): Beispiel-Kategorien
-- Legt die im Prompt genannten Kategorien an und ordnet die 5
-- bestehenden Beispielfragen sinnvoll ein. Überspringen, wenn ihr
-- lieber komplett selbst mit eigenen Kategorien starten wollt.
-- ============================================================

insert into categories (name, color) values
  ('DnD', '#A78BFA'),
  ('Anime', '#FF5C8A'),
  ('Games', '#38BDF8'),
  ('Musik', '#FB923C'),
  ('Allgemeinwissen', '#FFC53D'),
  ('Chatnachrichten', '#4ADE80')
on conflict (name) do nothing;

update questions set category_id = (select id from categories where name = 'Games')
where prompt like 'In welchem Jahr erschien das allererste The Legend of Zelda%';

update questions set category_id = (select id from categories where name = 'DnD')
where prompt like 'Wie viele Seiten hat das D&D Player%';

update questions set category_id = (select id from categories where name = 'DnD')
where prompt like 'Welcher NPC aus eurer Kampagne%';

update questions set category_id = (select id from categories where name = 'Games')
where prompt like 'Aus welchem Spiel stammt dieser Soundtrack%';

update questions set category_id = (select id from categories where name = 'Chatnachrichten')
where prompt like 'Wer hat diese Nachricht in eure Gruppe geschrieben%';
