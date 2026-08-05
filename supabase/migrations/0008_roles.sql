-- ============================================================
-- QUIZNACHT – Migration 0008: Rollenverwaltung (spieler/admin)
-- Nach 0001–0007 ausführen.
-- ============================================================
-- Führt eine Rolle je Account ein. "admin" darf den Fragenpool,
-- Kategorien, Quiz-Zusammenstellung und Bulk-/WhatsApp-Import verwalten;
-- "spieler" (Standard) darf nur mitspielen/hosten.

alter table profiles add column if not exists role text not null default 'spieler';

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('spieler', 'admin'));

-- ---------- Helper: ist der aktuell eingeloggte Nutzer Admin? ----------
-- security definer, damit die Funktion unabhängig von der RLS-Policy auf
-- profiles selbst zuverlässig auswerten kann.

create or replace function is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- Schutz gegen Selbst-Beförderung ----------
-- Verhindert, dass ein eingeloggter Nutzer sich per Client-Update selbst
-- die Rolle admin gibt. Greift nur bei Requests über eine Nutzer-Session
-- (auth.uid() gesetzt) – direkte SQL-/Dashboard-Änderungen (z.B. um
-- jemandem manuell admin zu geben) laufen ohne gesetztes auth.uid() und
-- sind davon nicht betroffen.

create or replace function prevent_role_self_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null and new.role is distinct from old.role and not is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profiles_role_guard on profiles;
create trigger on_profiles_role_guard
  before update on profiles
  for each row execute function prevent_role_self_escalation();

-- ============================================================
-- RLS: Verwaltungstabellen -> Lesen für alle eingeloggten Nutzer,
-- Schreiben/Ändern/Löschen nur für admin.
-- ============================================================

drop policy if exists "questions_all" on questions;
create policy "questions_select" on questions for select using (auth.role() = 'authenticated');
create policy "questions_insert" on questions for insert with check (is_admin());
create policy "questions_update" on questions for update using (is_admin()) with check (is_admin());
create policy "questions_delete" on questions for delete using (is_admin());

drop policy if exists "categories_all" on categories;
create policy "categories_select" on categories for select using (auth.role() = 'authenticated');
create policy "categories_insert" on categories for insert with check (is_admin());
create policy "categories_update" on categories for update using (is_admin()) with check (is_admin());
create policy "categories_delete" on categories for delete using (is_admin());

drop policy if exists "quizzes_all" on quizzes;
create policy "quizzes_select" on quizzes for select using (auth.role() = 'authenticated');
create policy "quizzes_insert" on quizzes for insert with check (is_admin());
create policy "quizzes_update" on quizzes for update using (is_admin()) with check (is_admin());
create policy "quizzes_delete" on quizzes for delete using (is_admin());

drop policy if exists "quiz_questions_all" on quiz_questions;
create policy "quiz_questions_select" on quiz_questions for select using (auth.role() = 'authenticated');
create policy "quiz_questions_insert" on quiz_questions for insert with check (is_admin());
create policy "quiz_questions_update" on quiz_questions for update using (is_admin()) with check (is_admin());
create policy "quiz_questions_delete" on quiz_questions for delete using (is_admin());

-- Medien-Uploads (Portrait-Bilder, Sounds) gehören zur Fragenpool-Pflege
-- -> ebenfalls nur admin. Lesen bleibt öffentlich (Bilder/Sounds werden
-- im laufenden Spiel für alle Rollen angezeigt).

drop policy if exists "question_media_insert" on storage.objects;
drop policy if exists "question_media_delete" on storage.objects;

create policy "question_media_insert" on storage.objects
  for insert with check (bucket_id = 'question-media' and is_admin());

create policy "question_media_delete" on storage.objects
  for delete using (bucket_id = 'question-media' and is_admin());

-- ============================================================
-- Beispiel: einem bestehenden Account nachträglich admin geben.
-- Im Supabase SQL-Editor ausführen (E-Mail anpassen):
--
-- update profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'name@example.com');
-- ============================================================
