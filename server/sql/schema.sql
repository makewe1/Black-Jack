create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text,
  created_at timestamptz not null default now()
);

create table if not exists email_codes (
  email text primary key,
  code text not null,
  purpose text not null check (purpose in ('signup','login')),
  expires_at timestamptz not null
);

-- Optional: case-insensitive unique email
create unique index if not exists users_email_lower_idx on users ((lower(email)));

create table if not exists game_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  game_id text,
  bet integer not null check (bet >= 0),
  outcome text not null check (outcome in ('won','lost','tie')),
  player_cards jsonb not null default '[]'::jsonb,
  dealer_cards jsonb not null default '[]'::jsonb,
  player_count integer not null,
  dealer_count integer,
  created_at timestamptz not null default now()
);

create index if not exists game_history_user_created_idx
  on game_history (user_id, created_at desc);