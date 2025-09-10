# Supabase Setup Guide for Bee-Five Multiplayer

## 🚀 Quick Setup (5 minutes)

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub/Google/Email
4. Click "New Project"
5. Choose organization and enter project details:
   - **Name**: `bee-five-multiplayer`
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"

### 2. Get Your Credentials
1. Go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key
3. Update the credentials in `src/utils/supabaseMultiplayer.ts`:
   ```typescript
   const SUPABASE_URL = 'https://your-project-id.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key-here';
   ```

### 3. Create Database Tables
Go to **SQL Editor** in Supabase dashboard and run this SQL:

```sql
-- Create rooms table
CREATE TABLE rooms (
  id BIGSERIAL PRIMARY KEY,
  room_id TEXT UNIQUE NOT NULL,
  host_name TEXT NOT NULL,
  guest_name TEXT,
  is_game_started BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create moves table
CREATE TABLE moves (
  id BIGSERIAL PRIMARY KEY,
  room_id TEXT NOT NULL,
  player_number INTEGER NOT NULL CHECK (player_number IN (1, 2)),
  row INTEGER NOT NULL,
  col INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_states table
CREATE TABLE game_states (
  id BIGSERIAL PRIMARY KEY,
  room_id TEXT UNIQUE NOT NULL,
  board TEXT NOT NULL, -- JSON stringified board
  current_player INTEGER NOT NULL CHECK (current_player IN (1, 2)),
  winner INTEGER NOT NULL CHECK (winner IN (0, 1, 2)),
  game_active BOOLEAN NOT NULL,
  player_names TEXT NOT NULL, -- JSON stringified player names
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
-- In production, you'd want more restrictive policies
CREATE POLICY "Allow all operations on rooms" ON rooms FOR ALL USING (true);
CREATE POLICY "Allow all operations on moves" ON moves FOR ALL USING (true);
CREATE POLICY "Allow all operations on game_states" ON game_states FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_rooms_room_id ON rooms(room_id);
CREATE INDEX idx_moves_room_id ON moves(room_id);
CREATE INDEX idx_game_states_room_id ON game_states(room_id);
CREATE INDEX idx_moves_created_at ON moves(created_at);
```

### 4. Enable Real-time
1. Go to **Database** → **Replication**
2. Enable replication for all tables:
   - ✅ `rooms`
   - ✅ `moves` 
   - ✅ `game_states`

### 5. Test Your Setup
1. Update your credentials in the code
2. Run `npm run dev`
3. Create a room and test multiplayer!

## 📊 Scaling Information

### Free Tier Limits:
- **Database**: 500MB storage
- **Bandwidth**: 2GB/month
- **Concurrent connections**: 60
- **Real-time connections**: 200

### Pro Tier ($25/month):
- **Database**: 8GB storage
- **Bandwidth**: 250GB/month
- **Concurrent connections**: 200
- **Real-time connections**: 500

### Enterprise:
- **Unlimited** scaling
- **Custom** regions
- **Dedicated** infrastructure

## 🔧 Configuration

### Environment Variables (Optional)
Create `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Then update `supabaseMultiplayer.ts`:
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

## 🚀 Production Deployment

### 1. Update Security Policies
For production, create more restrictive RLS policies:

```sql
-- Example: Only allow players in the same room to see moves
CREATE POLICY "Players can see moves in their room" ON moves
FOR SELECT USING (
  room_id IN (
    SELECT room_id FROM rooms 
    WHERE host_name = current_setting('request.jwt.claims', true)::json->>'email'
    OR guest_name = current_setting('request.jwt.claims', true)::json->>'email'
  )
);
```

### 2. Enable Authentication (Optional)
- Go to **Authentication** → **Settings**
- Configure email/password or OAuth providers
- Update policies to use authenticated users

### 3. Monitor Usage
- **Dashboard**: Monitor database usage
- **Logs**: Check for errors
- **Analytics**: Track player engagement

## 🎯 Benefits of This Setup

✅ **Automatic Scaling**: Handles 1 to 100,000+ players
✅ **Real-time**: Instant move synchronization
✅ **Global**: Low latency worldwide
✅ **Reliable**: 99.9% uptime SLA
✅ **Cost-effective**: Pay only for what you use
✅ **No server management**: Fully managed infrastructure

## 🆘 Troubleshooting

### Common Issues:
1. **"Invalid API key"**: Check your credentials
2. **"Table doesn't exist"**: Run the SQL setup
3. **"Real-time not working"**: Enable replication
4. **"CORS errors"**: Add your domain to allowed origins

### Support:
- **Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Discord**: [discord.supabase.com](https://discord.supabase.com)
- **GitHub**: [github.com/supabase/supabase](https://github.com/supabase/supabase)
