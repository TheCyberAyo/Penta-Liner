# Quick Start - Fix the Supabase Error

## The Error

You're seeing this error because the Supabase environment variables haven't been set up yet.

## Quick Fix (Choose One)

### Option 1: Set Up Supabase (Recommended for Multiplayer)

If you want the full multiplayer experience:

1. **Create a Supabase account** at https://supabase.com
2. **Create a new project** (free tier is fine)
3. **Wait 2 minutes** for the database to provision
4. **Run the SQL schema**:
   - Go to Supabase Dashboard → SQL Editor
   - Copy the contents of `supabase-schema.sql`
   - Paste and run it

5. **Get your credentials**:
   - Go to Settings → API
   - Copy your Project URL
   - Copy your `anon` key (public key)

6. **Create `.env.local` file** in `bee-five-nextjs/`:
```bash
cd bee-five-nextjs
echo "NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here" >> .env.local
```

7. **Replace with your actual credentials** in `.env.local`

8. **Restart the dev server**:
```bash
npm run dev
```

### Option 2: Temporarily Use Simple Multiplayer (No Setup Required)

If you just want to test the game without setting up Supabase:

The game will automatically fall back to the simple multiplayer mode (localStorage-based) when Supabase isn't configured. This works for single-device testing.

**Note**: This only works between browser tabs on the same computer, not across networks or devices.

## What You Get

With Supabase configured:
- ✅ Real cross-platform multiplayer (web ↔ mobile)
- ✅ Play across different devices/networks
- ✅ Real-time move synchronization
- ✅ Game state persistence
- ✅ Multiple concurrent games

Without Supabase (fallback):
- ⚠️ Only works on same device
- ⚠️ Browser tabs only
- ⚠️ No persistence
- ⚠️ Limited features

## Next Steps After Setup

1. Follow `SETUP_INSTRUCTIONS.md` for detailed setup
2. Complete the remaining component updates (see `IMPLEMENTATION_STATUS.md`)
3. Test with two devices


