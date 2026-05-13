-- =============================================
-- VV Domstad — Supabase Database Setup
-- =============================================

-- Seizoenen
create table public.seasons (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  start_date date not null,
  end_date date not null,
  active boolean default false,
  created_at timestamptz default now()
);

-- Spelers (gekoppeld aan auth.users)
create table public.players (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'player' check (role in ('admin', 'aanvoerder', 'player')),
  shirt_number int,
  position text,
  photo_url text,
  onboarded boolean default false,
  season_id uuid references public.seasons(id),
  created_at timestamptz default now()
);

-- Trainingen
create table public.trainings (
  id uuid default gen_random_uuid() primary key,
  season_id uuid references public.seasons(id),
  date date not null,
  time text not null,
  location text not null,
  notes text,
  created_by uuid references public.players(id),
  created_at timestamptz default now()
);

-- Wedstrijden
create table public.matches (
  id uuid default gen_random_uuid() primary key,
  season_id uuid references public.seasons(id),
  date date not null,
  time text not null,
  opponent text not null,
  home_away text not null check (home_away in ('thuis', 'uit')),
  location text not null,
  notes text,
  created_by uuid references public.players(id),
  created_at timestamptz default now()
);

-- RSVPs
create table public.rsvps (
  id uuid default gen_random_uuid() primary key,
  player_id uuid references public.players(id) on delete cascade,
  event_id uuid not null,
  event_type text not null check (event_type in ('training', 'match')),
  status text not null check (status in ('aanwezig', 'afwezig', 'misschien')),
  created_at timestamptz default now(),
  unique (player_id, event_id, event_type)
);

-- Boetes
create table public.fines (
  id uuid default gen_random_uuid() primary key,
  player_id uuid references public.players(id) on delete cascade,
  player_name text not null,
  category text not null,
  amount numeric(10,2) not null,
  reason text,
  match_id uuid references public.matches(id),
  training_id uuid references public.trainings(id),
  added_by uuid references public.players(id),
  added_by_name text not null,
  created_at timestamptz default now(),
  paid boolean default false,
  paid_at timestamptz,
  paid_received_by uuid references public.players(id),
  is_correction boolean default false,
  correction_of uuid references public.fines(id)
);

-- Aankondigingen
create table public.announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  body text not null,
  emoji text,
  created_by uuid references public.players(id),
  created_at timestamptz default now()
);

-- Aankondiging reacties
create table public.announcement_reactions (
  id uuid default gen_random_uuid() primary key,
  announcement_id uuid references public.announcements(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  emoji text not null,
  unique (announcement_id, player_id, emoji)
);

-- Rotatie cycli
create table public.rotation_cycles (
  id uuid default gen_random_uuid() primary key,
  season_id uuid references public.seasons(id),
  "order" jsonb not null,
  created_at timestamptz default now()
);

-- Rotatie swaps
create table public.rotation_swaps (
  id uuid default gen_random_uuid() primary key,
  cycle_id uuid references public.rotation_cycles(id) on delete cascade,
  requested_by uuid references public.players(id),
  requested_with uuid references public.players(id),
  slot_a int not null,
  slot_b int not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- Wedstrijd statistieken
create table public.match_stats (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.matches(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  goals int default 0,
  assists int default 0,
  yellow_cards int default 0,
  red_cards int default 0,
  unique (match_id, player_id)
);

-- Man of the Match votes
create table public.motm_votes (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.matches(id) on delete cascade,
  voter_id uuid references public.players(id) on delete cascade,
  voted_for_id uuid references public.players(id) on delete cascade,
  unique (match_id, voter_id)
);

-- Uitnodigingen / teamcodes
create table public.invites (
  id uuid default gen_random_uuid() primary key,
  code text not null,
  created_by uuid references public.players(id),
  used_by uuid references public.players(id),
  used_at timestamptz,
  active boolean default true
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

alter table public.players enable row level security;
alter table public.seasons enable row level security;
alter table public.trainings enable row level security;
alter table public.matches enable row level security;
alter table public.rsvps enable row level security;
alter table public.fines enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_reactions enable row level security;
alter table public.rotation_cycles enable row level security;
alter table public.rotation_swaps enable row level security;
alter table public.match_stats enable row level security;
alter table public.motm_votes enable row level security;
alter table public.invites enable row level security;
alter table public.lineups enable row level security;

-- Helper functie: haal rol op
create or replace function public.get_role(user_id uuid)
returns text as $$
  select role from public.players where id = user_id;
$$ language sql security definer;

-- Players
create policy "Iedereen leest spelers" on public.players for select to authenticated using (true);
create policy "Eigen profiel bijwerken" on public.players for update to authenticated using (auth.uid() = id);
create policy "Eigen profiel aanmaken" on public.players for insert to authenticated with check (auth.uid() = id);

-- Seasons
create policy "Iedereen leest seizoenen" on public.seasons for select to authenticated using (true);
create policy "Admin maakt seizoenen" on public.seasons for insert to authenticated with check (get_role(auth.uid()) = 'admin');
create policy "Admin update seizoenen" on public.seasons for update to authenticated using (get_role(auth.uid()) = 'admin');

-- Trainings
create policy "Iedereen leest trainingen" on public.trainings for select to authenticated using (true);
create policy "Admin maakt trainingen" on public.trainings for insert to authenticated with check (get_role(auth.uid()) = 'admin');

-- Matches
create policy "Iedereen leest wedstrijden" on public.matches for select to authenticated using (true);
create policy "Admin maakt wedstrijden" on public.matches for insert to authenticated with check (get_role(auth.uid()) = 'admin');

-- RSVPs
create policy "Iedereen leest rsvps" on public.rsvps for select to authenticated using (true);
create policy "Eigen rsvp aanmaken" on public.rsvps for insert to authenticated with check (auth.uid() = player_id);
create policy "Eigen rsvp bijwerken" on public.rsvps for update to authenticated using (auth.uid() = player_id);

-- Fines — NOOIT verwijderen
create policy "Iedereen leest boetes" on public.fines for select to authenticated using (true);
create policy "Admin voegt boetes toe" on public.fines for insert to authenticated with check (get_role(auth.uid()) = 'admin');
create policy "Admin update boetes (betaald)" on public.fines for update to authenticated using (get_role(auth.uid()) = 'admin');
-- Geen delete policy → boetes kunnen nooit verwijderd worden

-- Announcements
create policy "Iedereen leest aankondigingen" on public.announcements for select to authenticated using (true);
create policy "Admin plaatst aankondigingen" on public.announcements for insert to authenticated with check (get_role(auth.uid()) = 'admin');

-- Announcement reactions
create policy "Iedereen leest reacties" on public.announcement_reactions for select to authenticated using (true);
create policy "Eigen reactie toevoegen" on public.announcement_reactions for insert to authenticated with check (auth.uid() = player_id);
create policy "Eigen reactie verwijderen" on public.announcement_reactions for delete to authenticated using (auth.uid() = player_id);

-- Rotation
create policy "Iedereen leest rotatie" on public.rotation_cycles for select to authenticated using (true);
create policy "Admin maakt rotatie" on public.rotation_cycles for insert to authenticated with check (get_role(auth.uid()) = 'admin');
create policy "Admin update rotatie" on public.rotation_cycles for update to authenticated using (get_role(auth.uid()) = 'admin');

-- Rotation swaps
create policy "Iedereen leest swaps" on public.rotation_swaps for select to authenticated using (true);
create policy "Swap aanvragen" on public.rotation_swaps for insert to authenticated with check (auth.uid() = requested_by);
create policy "Swap beantwoorden" on public.rotation_swaps for update to authenticated using (auth.uid() = requested_with or get_role(auth.uid()) = 'admin');

-- Match stats
create policy "Iedereen leest stats" on public.match_stats for select to authenticated using (true);
create policy "Admin voegt stats toe" on public.match_stats for insert to authenticated with check (get_role(auth.uid()) = 'admin');
create policy "Admin update stats" on public.match_stats for update to authenticated using (get_role(auth.uid()) = 'admin');

-- MOTM votes
create policy "Iedereen leest votes" on public.motm_votes for select to authenticated using (true);
create policy "Eigen stem uitbrengen" on public.motm_votes for insert to authenticated with check (auth.uid() = voter_id);

-- Invites
create policy "Iedereen leest invites" on public.invites for select to authenticated using (true);
-- Anoniem lezen voor login flow
create policy "Anon leest actieve invites" on public.invites for select to anon using (active = true);
create policy "Admin beheert invites" on public.invites for insert to authenticated with check (get_role(auth.uid()) = 'admin');
create policy "Admin update invites" on public.invites for update to authenticated using (get_role(auth.uid()) = 'admin');

-- Lineups (aanvoerder + admin)
create policy "Iedereen leest opstellingen" on public.lineups for select to authenticated using (true);
create policy "Aanvoerder/admin maakt opstellingen" on public.lineups for insert to authenticated with check (get_role(auth.uid()) in ('admin', 'aanvoerder'));
create policy "Aanvoerder/admin update opstellingen" on public.lineups for update to authenticated using (get_role(auth.uid()) in ('admin', 'aanvoerder'));
create policy "Aanvoerder/admin verwijdert opstellingen" on public.lineups for delete to authenticated using (get_role(auth.uid()) in ('admin', 'aanvoerder'));

-- =============================================
-- Seed data
-- =============================================

-- Eerste seizoen
insert into public.seasons (name, start_date, end_date, active)
values ('2026-2027', '2026-08-01', '2027-06-30', true);

-- Eerste teamcode
insert into public.invites (code, active)
values ('DOMSTAD2026', true);

-- =============================================
-- Trigger: automatisch player record aanmaken bij registratie
-- =============================================
-- Opstellingen
create table public.lineups (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.matches(id) on delete cascade unique,
  formation text not null default '4-3-3',
  positions jsonb not null default '[]'::jsonb,
  substitutes uuid[] default '{}',
  created_by uuid references public.players(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.players (id, email, role, onboarded)
  values (new.id, new.email, 'player', false);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================
-- Na het aanmaken van de eerste twee admin-accounts (via magic link),
-- voer dit uit om ze admin te maken:
-- =============================================
-- UPDATE public.players SET role = 'admin' WHERE email IN ('admin1@example.com', 'admin2@example.com');

-- =============================================
-- Wekelijkse lineup reset (elke maandag 00:00 UTC)
-- =============================================
create or replace function public.reset_lineups_weekly()
returns void as $$
begin
  delete from public.lineups
  where match_id in (
    select id from public.matches where date < current_date
  );
end;
$$ language plpgsql security definer;

-- Activeer pg_cron en schedule de reset
-- Voer dit uit in de Supabase SQL Editor:
-- select cron.schedule('reset-lineups-weekly', '0 0 * * 1', 'select public.reset_lineups_weekly()');
