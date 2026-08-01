-- ============================================================
-- QUIZNACHT – Datenbankschema für Supabase
-- Einfach komplett in den SQL-Editor einfügen und ausführen.
-- ============================================================

-- ---------- Erweiterungen ----------
create extension if not exists "pgcrypto"; -- für gen_random_uuid()

-- ---------- Tabellen ----------

create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  order_index int not null,
  type text not null check (type in ('multiple_choice', 'schaetzfrage', 'portrait', 'sound', 'chat')),
  prompt text not null,
  options jsonb,              -- Antwortoptionen (multiple_choice, portrait, chat)
  correct_answer text,        -- richtige Option (multiple_choice, portrait, chat)
  correct_value numeric,      -- richtiger Zahlenwert (schaetzfrage)
  unit text,                  -- Einheit, z.B. "Seiten" (schaetzfrage)
  media_url text,             -- Bild-URL (portrait) oder Audio-URL (sound)
  message text,               -- Chat-Nachricht, die erraten werden soll (chat)
  note text,                  -- Hinweistext, z.B. "Später: eigene Bilder hochladen…"
  created_at timestamptz not null default now(),
  unique (quiz_id, order_index)
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  quiz_id uuid references quizzes(id) on delete set null,
  phase text not null default 'lobby' check (phase in ('lobby', 'question', 'end')),
  current_question_index int not null default 0,
  revealed boolean not null default false,
  blur int not null default 14,
  sound_playing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  name text not null,
  is_host boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (room_id, name)
);

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  value text not null,        -- gewählte Option als Text, oder Zahl als Text bei schaetzfrage
  submitted_at timestamptz not null default now(),
  unique (room_id, question_id, player_id)
);

create index if not exists idx_questions_quiz on questions(quiz_id);
create index if not exists idx_players_room on players(room_id);
create index if not exists idx_answers_room_question on answers(room_id, question_id);

-- ---------- 6-stelliger Raumcode ----------

create or replace function generate_room_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- ohne 0/O/1/I zur besseren Lesbarkeit
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

create or replace function set_room_code()
returns trigger
language plpgsql
as $$
declare
  candidate text;
  tries int := 0;
begin
  if new.code is null or new.code = '' then
    loop
      candidate := generate_room_code();
      exit when not exists (select 1 from rooms where code = candidate);
      tries := tries + 1;
      if tries > 20 then
        raise exception 'Konnte keinen eindeutigen Raumcode erzeugen';
      end if;
    end loop;
    new.code := candidate;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_room_code on rooms;
create trigger trg_set_room_code
  before insert on rooms
  for each row execute function set_room_code();

-- ---------- updated_at automatisch pflegen ----------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_rooms_updated_at on rooms;
create trigger trg_rooms_updated_at
  before update on rooms
  for each row execute function set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
-- Hinweis: Es gibt (noch) kein Login/Auth-Konzept – jede:r mit dem
-- anon-Key darf lesen/schreiben. Der Raumcode ist der einzige
-- "Schutz". Das ist für ein privates Party-Quiz unter Freund:innen
-- okay, aber NICHT für ein öffentliches Produkt gedacht. Später
-- lässt sich das mit Supabase Anonymous Auth + Besitz-Prüfung
-- (z.B. host_id = auth.uid()) verschärfen.

alter table quizzes enable row level security;
alter table questions enable row level security;
alter table rooms enable row level security;
alter table players enable row level security;
alter table answers enable row level security;

-- Quizze & Fragen: nur lesend für Clients (Inhalte pflegt ihr über den Dashboard/SQL-Editor)
create policy "quizzes_select" on quizzes for select using (true);
create policy "questions_select" on questions for select using (true);

-- Räume: lesen, anlegen, aktualisieren (Host steuert Phase/Frage/Aufdeckung)
create policy "rooms_select" on rooms for select using (true);
create policy "rooms_insert" on rooms for insert with check (true);
create policy "rooms_update" on rooms for update using (true) with check (true);

-- Spieler: lesen, beitreten, aktualisieren
create policy "players_select" on players for select using (true);
create policy "players_insert" on players for insert with check (true);
create policy "players_update" on players for update using (true) with check (true);

-- Antworten: lesen, abgeben, löschen (z.B. beim Neustart einer Runde)
create policy "answers_select" on answers for select using (true);
create policy "answers_insert" on answers for insert with check (true);
create policy "answers_delete" on answers for delete using (true);

-- ============================================================
-- Realtime aktivieren
-- ============================================================
-- Damit alle Browser (Host- und Spieler-Ansicht) live synchron bleiben,
-- müssen "rooms" und "answers" der Realtime-Publikation hinzugefügt werden.
-- (Äquivalent zum Umschalten im Dashboard unter Database → Replication.)

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table rooms;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'answers'
  ) then
    alter publication supabase_realtime add table answers;
  end if;

  -- Optional, aber empfehlenswert: auch "players" live syncen, damit der Host
  -- sieht, wer der Lobby beitritt, ohne die Seite neu zu laden.
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'players'
  ) then
    alter publication supabase_realtime add table players;
  end if;
end;
$$;
