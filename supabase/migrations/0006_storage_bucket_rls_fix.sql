-- ============================================================
-- QUIZNACHT – Migration 0006: Storage-Bucket-Sichtbarkeit reparieren
-- Nach 0005 ausführen.
-- ============================================================
-- 0005 hat Policies für storage.objects (die Dateien) angelegt, aber
-- keine für storage.buckets (die Bucket-Metadaten selbst). Ohne eine
-- select-Policy dort meldet die Storage-API "Bucket not found", obwohl
-- der Bucket existiert – jede:r Client-Request scheitert am Sichtbar-
-- keits-Check, bevor er überhaupt bei den Objekten ankommt.

drop policy if exists "question_media_bucket_read" on storage.buckets;

create policy "question_media_bucket_read" on storage.buckets
  for select using (id = 'question-media');
