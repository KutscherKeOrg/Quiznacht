-- ============================================================
-- QUIZNACHT – Migration 0002: Zentraler Fragenpool + Kategorien
-- Nach supabase/schema.sql (und optional seed.sql) ausführen.
-- Baut den bisherigen 1:1-Zusammenhang "Frage gehört zu einem Quiz"
-- in "Frage gehört zum Pool, Quiz zieht sich Fragen aus dem Pool" um.
-- ============================================================

-- ---------- Kategorien ----------

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#A78BFA',
  created_at timestamptz not null default now()
);

-- ---------- Fragen vom Quiz entkoppeln ----------

alter table questions add column if not exists category_id uuid references categories(id) on delete set null;
alter table questions add column if not exists last_played_at timestamptz;
alter table questions add column if not exists updated_at timestamptz not null default now();

-- ---------- Verknüpfungstabelle Quiz <-> Fragen ----------

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  order_index int not null,
  created_at timestamptz not null default now(),
  unique (quiz_id, question_id),
  unique (quiz_id, order_index)
);

create index if not exists idx_quiz_questions_quiz on quiz_questions(quiz_id);
create index if not exists idx_quiz_questions_question on quiz_questions(question_id);

-- Bestehende Fragen (bisher direkt per quiz_id/order_index an ein Quiz
-- gebunden) in die neue Verknüpfungstabelle überführen, BEVOR die alten
-- Spalten entfernt werden.
insert into quiz_questions (quiz_id, question_id, order_index)
select quiz_id, id, order_index
from questions
where quiz_id is not null
on conflict (quiz_id, question_id) do nothing;

-- Alte, jetzt überflüssige Spalten/Constraints/Indizes entfernen.
alter table questions drop constraint if exists questions_quiz_id_order_index_key;
drop index if exists idx_questions_quiz;
alter table questions drop column if exists quiz_id;
alter table questions drop column if exists order_index;

-- ---------- updated_at für Fragen automatisch pflegen ----------
-- (set_updated_at() wurde bereits in schema.sql angelegt)

drop trigger if exists trg_questions_updated_at on questions;
create trigger trg_questions_updated_at
  before update on questions
  for each row execute function set_updated_at();

-- ============================================================
-- Row Level Security für die neuen/geänderten Tabellen
-- ============================================================
-- Gleiches Modell wie im Rest der App: kein Login, jede:r mit dem
-- anon-Key darf den Pool/die Quizze verwalten.

alter table categories enable row level security;
alter table quiz_questions enable row level security;

create policy "categories_select" on categories for select using (true);
create policy "categories_insert" on categories for insert with check (true);
create policy "categories_update" on categories for update using (true) with check (true);
create policy "categories_delete" on categories for delete using (true);

create policy "quiz_questions_select" on quiz_questions for select using (true);
create policy "quiz_questions_insert" on quiz_questions for insert with check (true);
create policy "quiz_questions_update" on quiz_questions for update using (true) with check (true);
create policy "quiz_questions_delete" on quiz_questions for delete using (true);

-- Fragen und Quizze wurden bisher nur per SQL-Editor gepflegt (nur
-- "select"-Policy). Der neue Editor schreibt jetzt direkt aus der App.
create policy "questions_insert" on questions for insert with check (true);
create policy "questions_update" on questions for update using (true) with check (true);
create policy "questions_delete" on questions for delete using (true);

create policy "quizzes_insert" on quizzes for insert with check (true);
create policy "quizzes_update" on quizzes for update using (true) with check (true);
create policy "quizzes_delete" on quizzes for delete using (true);

-- ============================================================
-- Realtime für den Editor
-- ============================================================
-- Nicht zwingend nötig (der Editor liest/schreibt außerhalb eines
-- laufenden Spiels), aber praktisch, falls mehrere Leute gleichzeitig
-- am Pool bauen.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'questions'
  ) then
    alter publication supabase_realtime add table questions;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'categories'
  ) then
    alter publication supabase_realtime add table categories;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'quiz_questions'
  ) then
    alter publication supabase_realtime add table quiz_questions;
  end if;
end;
$$;
