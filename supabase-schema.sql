-- Bee-Five Multiplayer Database Schema
-- Run this in your Supabase SQL Editor

-- Enable Realtime for all tables
alter publication supabase_realtime add table game_rooms;
alter publication supabase_realtime add table game_players;
alter publication supabase_realtime add table game_moves;
alter publication supabase_realtime add table game_state;

-- Create game_rooms table
create table if not exists public.game_rooms (
  id uuid default gen_random_uuid() primary key,
  room_code text unique not null,
  host_id text not null,
  status text check (status in ('waiting', 'active', 'finished')) default 'waiting',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create game_players table
create table if not exists public.game_players (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.game_rooms(id) on delete cascade,
  player_name text not null,
  player_number integer check (player_number in (1, 2)) not null,
  is_host boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create game_moves table
create table if not exists public.game_moves (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.game_rooms(id) on delete cascade,
  player_number integer check (player_number in (1, 2)) not null,
  row integer not null,
  col integer not null,
  timestamp text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create game_state table
create table if not exists public.game_state (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.game_rooms(id) on delete cascade,
  board_state text not null, -- JSON string of board
  current_player integer check (current_player in (1, 2)) not null,
  winner integer check (winner in (0, 1, 2)) default 0,
  is_game_active boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for performance
create index if not exists idx_game_rooms_room_code on public.game_rooms(room_code);
create index if not exists idx_game_players_room_id on public.game_players(room_id);
create index if not exists idx_game_moves_room_id on public.game_moves(room_id);
create index if not exists idx_game_state_room_id on public.game_state(room_id);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Add updated_at trigger to game_rooms
create trigger set_updated_at
  before update on public.game_rooms
  for each row
  execute function public.handle_updated_at();

-- Add updated_at trigger to game_state
create trigger set_updated_at_game_state
  before update on public.game_state
  for each row
  execute function public.handle_updated_at();

-- Enable Row Level Security (RLS)
alter table public.game_rooms enable row level security;
alter table public.game_players enable row level security;
alter table public.game_moves enable row level security;
alter table public.game_state enable row level security;

-- Create policies for public access (adjust as needed for your security requirements)
-- For development: allow all operations
-- For production: implement proper authentication

-- Policy for game_rooms
create policy "Allow all operations on game_rooms" on public.game_rooms
  for all using (true) with check (true);

-- Policy for game_players
create policy "Allow all operations on game_players" on public.game_players
  for all using (true) with check (true);

-- Policy for game_moves
create policy "Allow all operations on game_moves" on public.game_moves
  for all using (true) with check (true);

-- Policy for game_state
create policy "Allow all operations on game_state" on public.game_state
  for all using (true) with check (true);

-- Add cleanup function to remove old rooms (optional)
create or replace function public.cleanup_old_rooms()
returns void as $$
begin
  delete from public.game_rooms
  where status = 'finished'
    and updated_at < timezone('utc'::text, now()) - interval '24 hours';
end;
$$ language plpgsql;



