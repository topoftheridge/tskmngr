-- ============================================
-- Task Manager Schema for Supabase
-- Run this in the Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================
create type task_status as enum ('backlog', 'planning', 'in_progress', 'waiting', 'done');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');

-- ============================================
-- PROFILES
-- ============================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Authenticated users can view all profiles"
  on profiles for select to authenticated using (true);

create policy "Users can update own profile"
  on profiles for update to authenticated using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert to authenticated with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- PROJECTS
-- ============================================
create table projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  client_name text,
  color text default '#6366f1',
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

alter table projects enable row level security;

create policy "Authenticated users can do everything with projects"
  on projects for all to authenticated using (true) with check (true);

-- ============================================
-- TASKS
-- ============================================
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  status task_status default 'backlog',
  priority task_priority default 'medium',
  assigned_to uuid references profiles(id),
  project_id uuid references projects(id) on delete set null,
  due_date date,
  position int default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table tasks enable row level security;

create policy "Authenticated users can do everything with tasks"
  on tasks for all to authenticated using (true) with check (true);

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on tasks
  for each row execute function public.update_updated_at();

-- ============================================
-- COMMENTS
-- ============================================
create table comments (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  content text not null,
  created_at timestamptz default now()
);

alter table comments enable row level security;

create policy "Authenticated users can do everything with comments"
  on comments for all to authenticated using (true) with check (true);

-- ============================================
-- INDEXES
-- ============================================
create index idx_tasks_status on tasks(status);
create index idx_tasks_project on tasks(project_id);
create index idx_tasks_assigned on tasks(assigned_to);
create index idx_tasks_due_date on tasks(due_date);
create index idx_comments_task on comments(task_id);
