# Supabase Setup Instructions

## Step 1: Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://vrroaxgywdatlbjsuqbo.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_2hnW9eQlg848Vrl7rScvYQ_RPa-fR2P
```

## Step 2: Run Database Migration

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
5. Paste it into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)

This will create:
- All necessary tables (rooms, guests, bookings, room_status_log, settings)
- Insert initial room data (20+ rooms)
- Set up Row Level Security policies
- Create database triggers and functions

## Step 3: Verify Tables

After running the migration, verify in Supabase:
1. Go to **Table Editor** (left sidebar)
2. You should see these tables:
   - `rooms` (should have 20+ rows)
   - `guests`
   - `bookings`
   - `room_status_log`
   - `settings` (should have 1 row with GST rate)

## Step 4: Create Admin User

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click **Add User** → **Create New User**
3. Enter email and password for your receptionist/admin account
4. Save the credentials - you'll use these to log into the app

## Step 5: Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:5173 in your browser
3. Log in with the credentials you created in Step 4
4. You should see the dashboard with all rooms listed

## Troubleshooting

### If you get authentication errors:
- Make sure RLS policies are enabled (they should be from the migration)
- Verify your API keys are correct in `.env`

### If rooms don't appear:
- Check the `rooms` table in Supabase Table Editor
- Verify the migration ran successfully
- Check browser console for errors

### If you can't log in:
- Make sure you created a user in Supabase Authentication
- Check that the email/password are correct
- Verify Supabase Auth is enabled in your project settings

