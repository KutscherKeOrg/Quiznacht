-- ============================================================
-- QUIZNACHT – Migration 0004: Accounts + Statistiken
-- Nach 0001–0003 ausführen.
-- Führt echte Accounts (Supabase Auth) ein: Verwalten und Mitspielen
-- brauchen jetzt einen Login. Außerdem: Antwortzeiten, Sieg-Historie
-- und Kategorien-Ranking als Grundlage für die Statistik-Seite.
-- ============================================================

-- ---------- Profile (1:1 zu auth.users) ----------

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles_select" on profiles;
drop policy if exists "profiles_insert_self" on profiles;
drop policy if exists "profiles_update_self" on profiles;

create policy "profiles_select" on profiles for select using (auth.role() = 'authenticated');
create policy "profiles_insert_self" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_self" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Legt bei jeder neuen Registrierung automatisch ein Profil an.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- Spieler an Accounts binden ----------
-- Mitspielen braucht jetzt einen Account statt eines frei getippten Namens.

alter table players add column if not exists profile_id uuid references profiles(id) on delete cascade;

alter table players drop constraint if exists players_room_id_name_key;
alter table players drop constraint if exists players_room_id_profile_id_key;
alter table players add constraint players_room_id_profile_id_key unique (room_id, profile_id);

-- ---------- Antwortzeiten ----------

alter table answers add column if not exists elapsed_ms integer;
alter table rooms add column if not exists question_started_at timestamptz;

-- ---------- Sieg-Historie für Statistiken ----------
-- Wird beim Erreichen der Siegerehrung einmal pro Raum befüllt, damit
-- "meiste Siege" nicht bei jedem Statistik-Aufruf aus allen Antworten
-- aller Spieleabende neu berechnet werden muss.

create table if not exists room_results (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  player_name text not null,
  score int not null,
  rank int not null,
  created_at timestamptz not null default now(),
  unique (room_id, profile_id)
);

create index if not exists idx_room_results_profile on room_results(profile_id);

alter table room_results enable row level security;

drop policy if exists "room_results_select" on room_results;
drop policy if exists "room_results_insert" on room_results;

create policy "room_results_select" on room_results for select using (auth.role() = 'authenticated');
create policy "room_results_insert" on room_results for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- RLS überall auf "muss eingeloggt sein" umstellen
-- ============================================================
-- Bisher durfte jede:r mit dem anon-Key alles lesen/schreiben (okay für
-- ein Tool ganz ohne Login). Jetzt gibt es Accounts, also wird das
-- verschärft: alle Tabellen brauchen ab jetzt einen eingeloggten Nutzer.
-- Es gibt (noch) keine Rollen – jeder Account darf verwalten und spielen.

drop policy if exists "quizzes_select" on quizzes;
drop policy if exists "quizzes_insert" on quizzes;
drop policy if exists "quizzes_update" on quizzes;
drop policy if exists "quizzes_delete" on quizzes;
create policy "quizzes_all" on quizzes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "questions_select" on questions;
drop policy if exists "questions_insert" on questions;
drop policy if exists "questions_update" on questions;
drop policy if exists "questions_delete" on questions;
create policy "questions_all" on questions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "categories_select" on categories;
drop policy if exists "categories_insert" on categories;
drop policy if exists "categories_update" on categories;
drop policy if exists "categories_delete" on categories;
create policy "categories_all" on categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "quiz_questions_select" on quiz_questions;
drop policy if exists "quiz_questions_insert" on quiz_questions;
drop policy if exists "quiz_questions_update" on quiz_questions;
drop policy if exists "quiz_questions_delete" on quiz_questions;
create policy "quiz_questions_all" on quiz_questions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "rooms_select" on rooms;
drop policy if exists "rooms_insert" on rooms;
drop policy if exists "rooms_update" on rooms;
create policy "rooms_all" on rooms for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "players_select" on players;
drop policy if exists "players_insert" on players;
drop policy if exists "players_update" on players;
create policy "players_all" on players for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "answers_select" on answers;
drop policy if exists "answers_insert" on answers;
drop policy if exists "answers_delete" on answers;
create policy "answers_all" on answers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- Realtime für die neuen Tabellen
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table profiles;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'room_results'
  ) then
    alter publication supabase_realtime add table room_results;
  end if;
end;
$$;
