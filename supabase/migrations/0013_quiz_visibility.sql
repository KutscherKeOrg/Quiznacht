-- ============================================================
-- QUIZNACHT – Migration 0013: Sichtbarkeit für Quizze (privat/öffentlich)
-- Nach 0001–0012 ausführen.
-- ============================================================
-- Jedes Quiz bekommt einen Eigentümer (den erstellenden Admin) und eine
-- Sichtbarkeit. Bestehende Quizze bleiben unangetastet (owner_id = null,
-- visibility = 'public' per Default), da sie bisher niemandem "gehörten".
--
-- Durchgesetzt wird das App-seitig über die Abfragen in usePool.js/App.jsx
-- (welche Quizze/Fragen ein Admin in Verwaltung + Zufallsziehung sieht),
-- NICHT über RLS: Spieler:innen und andere Admins müssen weiterhin ganz
-- normal in einem laufenden Raum lesen können, auch wenn der Raum auf
-- einem privaten Quiz basiert (sonst könnten sie nicht mitspielen). Es ist
-- also eine Sichtbarkeits-/Aufräum-Regel für die Verwaltungsoberfläche,
-- keine harte Zugriffsschranke.

alter table quizzes add column if not exists owner_id uuid references profiles(id) on delete set null;
alter table quizzes add column if not exists visibility text not null default 'public';

alter table quizzes drop constraint if exists quizzes_visibility_check;
alter table quizzes add constraint quizzes_visibility_check check (visibility in ('private', 'public'));

create index if not exists idx_quizzes_owner on quizzes(owner_id);
