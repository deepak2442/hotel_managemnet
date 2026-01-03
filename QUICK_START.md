# Quick Start Guide - Hotel Management System

## ✅ Step 1: Environment Variables (DONE)
Your `.env` file has been created with your Supabase credentials.

## 🔧 Step 2: Set Up Database in Supabase

### Option A: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Run the Migration**
   - Open the file `setup-supabase.sql` in this project
   - Copy **ALL** the contents
   - Paste into the SQL Editor
   - Click **Run** (or press Ctrl+Enter)

4. **Verify Setup**
   - Go to **Table Editor** in the left sidebar
   - You should see 5 tables:
     - ✅ `rooms` (with 20 rows)
     - ✅ `guests` (empty)
     - ✅ `bookings` (empty)
     - ✅ `room_status_log` (empty)
     - ✅ `settings` (with 1 row for GST rate)

### Option B: Using Supabase CLI (Advanced)
If you have Supabase CLI installed:
```bash
supabase db push
```

## 👤 Step 3: Create Admin User

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Click **Add User** → **Create New User**
3. Enter:
   - **Email**: (e.g., admin@hotel.com)
   - **Password**: (choose a strong password)
4. Click **Create User**
5. **Save these credentials** - you'll need them to log in!

## 🚀 Step 4: Start the Application

```bash
npm run dev
```

The app will start at: http://localhost:5173

## 🔐 Step 5: Log In

1. Open http://localhost:5173 in your browser
2. Use the email and password you created in Step 3
3. You should see the dashboard with all 20 rooms!

## 📋 What You'll See

- **Dashboard**: Overview of rooms and today's activity
- **Rooms**: Visual grid of all rooms with status
- **Check-In**: Select a room and check in guests
- **Check-Out**: View active bookings and process check-outs
- **Reports**: Generate daily, monthly, and yearly reports

## 🆘 Troubleshooting

### "Failed to fetch" or Connection Error
- Verify your `.env` file has the correct credentials
- Check that Supabase project is active
- Restart the dev server after changing `.env`

### "No rooms found"
- Make sure you ran the SQL migration (Step 2)
- Check the `rooms` table in Supabase Table Editor
- Verify it has 20 rows

### "Authentication failed"
- Make sure you created a user in Supabase Authentication
- Check email/password are correct
- Verify RLS policies were created (they should be from the migration)

### Can't see tables
- Go back to SQL Editor and run the migration again
- Check for any error messages in the SQL Editor

## ✨ You're All Set!

Your hotel management system is ready to use. Start checking in guests!

