# Bee-Five Universal Multiplayer Setup

This guide will help you set up the universal backend for both the web and mobile versions of Bee-Five.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js installed
- Supabase CLI (optional, but recommended)

## Setup Steps

### 1. Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in the project details:
   - Name: `bee-five`
   - Database Password: (choose a strong password)
   - Region: (choose closest to your users)
4. Wait for the project to be created (takes ~2 minutes)

### 2. Configure Supabase Database

1. In your Supabase project dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql` from the project root
3. Paste into the SQL Editor
4. Click "Run" to execute the schema

This will create:
- `game_rooms` table (stores room information)
- `game_players` table (stores player information)
- `game_moves` table (stores game moves in real-time)
- `game_state` table (stores current game state)

### 3. Get Supabase Credentials

1. In your Supabase project, go to **Settings** > **API**
2. Copy:
   - `Project URL` (e.g., `https://xxxxx.supabase.co`)
   - `anon/public` key (the public anon key)

### 4. Configure Web Version (Next.js)

1. Create `.env.local` file in `bee-five-nextjs/` directory:
```bash
cd bee-five-nextjs
cp .env.example .env.local
```

2. Edit `.env.local` and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

3. Install dependencies (if not already done):
```bash
npm install
```

4. Test the web version:
```bash
npm run dev
```

### 5. Configure Mobile Version (Expo)

1. Create `.env` file in `bee-five-mobile/` directory:
```bash
cd bee-five-mobile
cp .env.example .env
```

2. Edit `.env` and add your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

3. Install dependencies (if not already done):
```bash
npm install
```

4. Test the mobile version:
```bash
npm start
```

### 6. Test Universal Multiplayer

1. Start the web version on one device/browser
2. Start the mobile version on another device (or use Expo Go app)
3. Both apps should be able to:
   - Create rooms
   - Join rooms by code
   - Play multiplayer games together
   - See moves in real-time

## Database Schema Overview

### `game_rooms`
- Stores room information
- Unique room codes for joining
- Tracks room status (waiting, active, finished)

### `game_players`
- Stores player information per room
- Tracks player number (1 or 2)
- Identifies host vs guest

### `game_moves`
- Stores individual moves in real-time
- Used for synchronizing game play
- Contains row, col, player_number, timestamp

### `game_state`
- Stores current game board state
- Tracks current player
- Tracks winner and game status

## Real-time Features

The implementation uses Supabase Realtime for:
- **Instant move updates**: Moves appear in real-time across all connected clients
- **Live game state**: Both players always see the same board state
- **Connection status**: Know when opponents are connected
- **Cross-platform sync**: Web and mobile stay in sync automatically

## Troubleshooting

### "Cannot connect to Supabase"
- Check that your credentials are correct in `.env` files
- Verify Supabase project is running (check Supabase dashboard)
- Ensure you've run the SQL schema

### "Room not found"
- Check that game_rooms table exists in Supabase
- Verify RLS policies are set correctly

### "Cannot send moves"
- Check that game_moves table exists
- Verify Realtime is enabled for the table in Supabase dashboard

### Real-time not working
1. Go to Supabase dashboard > Database > Replication
2. Ensure "Enable Realtime" is turned on for all game tables
3. Check browser console for WebSocket connection errors

## Security Notes

The current setup uses public access for simplicity. For production:

1. Implement user authentication (Supabase Auth)
2. Update RLS policies to restrict access
3. Add rate limiting for move submissions
4. Implement proper authorization checks

## Next Steps

- Add user authentication
- Add chat functionality
- Add game history
- Add leaderboards
- Add turn timers

## Support

If you encounter issues:
1. Check the Supabase logs (Dashboard > Logs)
2. Check browser/device console for errors
3. Verify environment variables are set correctly
4. Ensure all dependencies are installed




