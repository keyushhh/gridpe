-- Waitlist for the marketing site (grid.pe). The public form posts straight to
-- PostgREST with the anon key, so this table is INSERT-ONLY for anon: no select,
-- no update, no delete. Nobody can read the list back out with a public key.

create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text        not null,
  area       text,                              -- optional: "which street next"
  source     text        not null default 'website',
  created_at timestamptz not null default now()
);

-- one row per person, case-insensitively
create unique index if not exists waitlist_email_uniq
  on public.waitlist (lower(email));

create index if not exists waitlist_created_at_idx
  on public.waitlist (created_at desc);

alter table public.waitlist enable row level security;

-- anon may only insert, and only rows that look like a real signup
drop policy if exists "anon can join the waitlist" on public.waitlist;
create policy "anon can join the waitlist"
  on public.waitlist
  for insert
  to anon
  with check (
    email is not null
    and length(email) between 5 and 254
    and email like '%_@_%._%'
    and (area is null or length(area) <= 120)
    and source = 'website'
  );

-- column-scoped so anon cannot forge id or created_at
revoke all on public.waitlist from anon;
grant insert (email, area, source) on public.waitlist to anon;
