create table if not exists public.wedding_comments (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  comment text not null check (char_length(btrim(comment)) between 1 and 500),
  attendance text not null check (attendance in ('hadir', 'tidak-hadir')),
  created_at timestamptz not null default now()
);

create table if not exists public.wedding_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.wedding_comments enable row level security;
alter table public.wedding_admins enable row level security;

grant select, insert on public.wedding_comments to anon, authenticated;
grant delete on public.wedding_comments to authenticated;
grant select on public.wedding_admins to authenticated;

drop policy if exists "Anyone can read wedding comments" on public.wedding_comments;
create policy "Anyone can read wedding comments"
  on public.wedding_comments for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can post valid wedding comments" on public.wedding_comments;
create policy "Anyone can post valid wedding comments"
  on public.wedding_comments for insert
  to anon, authenticated
  with check (
    char_length(btrim(name)) between 1 and 120
    and char_length(btrim(comment)) between 1 and 500
    and attendance in ('hadir', 'tidak-hadir')
  );

drop policy if exists "Wedding admins can delete comments" on public.wedding_comments;
create policy "Wedding admins can delete comments"
  on public.wedding_comments for delete
  to authenticated
  using (
    exists (
      select 1
      from public.wedding_admins
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "Wedding admins can read their own role" on public.wedding_admins;
create policy "Wedding admins can read their own role"
  on public.wedding_admins for select
  to authenticated
  using (user_id = (select auth.uid()));
