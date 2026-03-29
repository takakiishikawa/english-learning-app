-- English Learning App - Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Grammar table
create table if not exists grammar (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  summary text not null,
  detail text,
  examples text not null,
  usage_scene text not null,
  frequency smallint not null default 3,
  play_count integer not null default 0,
  last_played_at date,
  created_at timestamptz not null default now()
);

-- Expressions table
create table if not exists expressions (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  expression text not null,
  meaning text not null,
  conversation text not null,
  usage_scene text not null,
  frequency smallint not null default 3,
  play_count integer not null default 0,
  last_played_at date,
  created_at timestamptz not null default now()
);

-- Lessons table
create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  level smallint not null,
  lesson_no text not null,
  topic text not null,
  status text not null default '未受講' check (status in ('未受講', 'try', 'Done'))
);

-- Practice logs table (one row per day, upsert on practiced_at)
create table if not exists practice_logs (
  id uuid primary key default gen_random_uuid(),
  practiced_at date not null unique,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table grammar enable row level security;
alter table expressions enable row level security;
alter table lessons enable row level security;
alter table practice_logs enable row level security;

-- Policies: authenticated users can do everything (personal app)
create policy "Authenticated users can read grammar"
  on grammar for select to authenticated using (true);

create policy "Authenticated users can insert grammar"
  on grammar for insert to authenticated with check (true);

create policy "Authenticated users can update grammar"
  on grammar for update to authenticated using (true);

create policy "Authenticated users can delete grammar"
  on grammar for delete to authenticated using (true);

create policy "Authenticated users can read expressions"
  on expressions for select to authenticated using (true);

create policy "Authenticated users can insert expressions"
  on expressions for insert to authenticated with check (true);

create policy "Authenticated users can update expressions"
  on expressions for update to authenticated using (true);

create policy "Authenticated users can delete expressions"
  on expressions for delete to authenticated using (true);

create policy "Authenticated users can read lessons"
  on lessons for select to authenticated using (true);

create policy "Authenticated users can insert lessons"
  on lessons for insert to authenticated with check (true);

create policy "Authenticated users can update lessons"
  on lessons for update to authenticated using (true);

create policy "Authenticated users can delete lessons"
  on lessons for delete to authenticated using (true);

create policy "Authenticated users can read practice_logs"
  on practice_logs for select to authenticated using (true);

create policy "Authenticated users can insert practice_logs"
  on practice_logs for insert to authenticated with check (true);

create policy "Authenticated users can update practice_logs"
  on practice_logs for update to authenticated using (true);
