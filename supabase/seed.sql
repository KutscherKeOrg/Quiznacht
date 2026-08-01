-- ============================================================
-- QUIZNACHT – Beispiel-Quiz zum Testen
-- Optional: nach schema.sql ausführen, um die 5 Fragen aus dem
-- Prototyp als echtes Quiz in der Datenbank anzulegen.
-- ============================================================

do $$
declare
  v_quiz_id uuid;
begin
  insert into quizzes (title) values ('Freitags-Quiz') returning id into v_quiz_id;

  insert into questions (quiz_id, order_index, type, prompt, options, correct_answer, correct_value, unit, media_url, message, note)
  values
    (
      v_quiz_id, 0, 'multiple_choice',
      'In welchem Jahr erschien das allererste The Legend of Zelda?',
      '["1984", "1986", "1989", "1991"]'::jsonb,
      '1986', null, null, null, null, null
    ),
    (
      v_quiz_id, 1, 'schaetzfrage',
      'Wie viele Seiten hat das D&D Player''s Handbook (5e, 2014)?',
      null, null, 320, 'Seiten', null, null, null
    ),
    (
      v_quiz_id, 2, 'portrait',
      'Welcher NPC aus eurer Kampagne ist das?',
      '["Alrik der Graue", "Wirtin Berla", "Fenwick Flink", "Ser Oduin"]'::jsonb,
      'Alrik der Graue', null, null, null, null,
      'Später: eigene Bilder hochladen, Host deckt stufenweise auf.'
    ),
    (
      v_quiz_id, 3, 'sound',
      'Aus welchem Spiel stammt dieser Soundtrack-Ausschnitt?',
      '["Stardew Valley", "Hollow Knight", "Celeste", "Terraria"]'::jsonb,
      'Hollow Knight', null, null, null, null,
      'Später: eigene Audio-Uploads, Wiedergabe direkt in der App.'
    ),
    (
      v_quiz_id, 4, 'chat',
      'Wer hat diese Nachricht in eure Gruppe geschrieben?',
      '["Lena", "Ben", "Kiki", "Momo"]'::jsonb,
      'Momo', null, null, null,
      '„wer kommt heute pünktlich? also 20:15. ich frag für einen freund (mich, ich bin spät dran)“',
      null
    );
end;
$$;
