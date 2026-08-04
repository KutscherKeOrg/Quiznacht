-- ============================================================
-- QUIZNACHT – Migration 0005: Medien-Upload + offene Portrait-Antworten
-- Nach 0001–0004 ausführen.
-- ============================================================

-- ---------- Storage-Bucket für Portrait-Bilder & Sound-Dateien ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'question-media',
  'question-media',
  true,
  10485760, -- 10 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "question_media_read" on storage.objects;
drop policy if exists "question_media_insert" on storage.objects;
drop policy if exists "question_media_delete" on storage.objects;

create policy "question_media_read" on storage.objects
  for select using (bucket_id = 'question-media');

create policy "question_media_insert" on storage.objects
  for insert with check (bucket_id = 'question-media' and auth.role() = 'authenticated');

create policy "question_media_delete" on storage.objects
  for delete using (bucket_id = 'question-media' and auth.role() = 'authenticated');

-- ---------- Portrait-Fragen nutzen jetzt eine offene Texteingabe ----------
-- (statt einer festen Auswahl an Optionen). Alte Options-Listen sind damit
-- überflüssig; correct_answer bleibt unverändert stehen.

update questions set options = null where type = 'portrait';
