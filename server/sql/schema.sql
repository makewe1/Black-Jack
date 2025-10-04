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
