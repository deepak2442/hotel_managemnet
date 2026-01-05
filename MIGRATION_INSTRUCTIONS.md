# Database Migration Instructions

## Fix: Schema Cache Error

If you're getting the error:
```
Could not find the 'cash_amount' column of 'bookings' in the schema cache
```

This means the migration file `005_add_payment_tracking.sql` hasn't been run yet in your Supabase database.

## Steps to Fix:

### 1. Open Supabase Dashboard
- Go to: https://supabase.com/dashboard
- Select your project

### 2. Open SQL Editor
- Click **SQL Editor** in the left sidebar
- Click **New Query**

### 3. Run the Migration
- Open the file `supabase/migrations/005_add_payment_tracking.sql` in this project
- Copy **ALL** the contents
- Paste into the SQL Editor
- Click **Run** (or press Ctrl+Enter)

### 4. Verify Migration
- Go to **Table Editor** → **bookings** table
- You should see these new columns:
  - ✅ `qr_amount` (DECIMAL)
  - ✅ `cash_amount` (DECIMAL)
  - ✅ `extended_amount` (DECIMAL)

### 5. Refresh Your Application
- Restart your development server if it's running
- The error should be resolved

## What This Migration Does:

1. Adds `qr_amount`, `cash_amount`, and `extended_amount` columns to the `bookings` table
2. Updates the `payment_method` constraint to allow 'cash', 'qr', or 'mixed'
3. Migrates existing data (assumes all existing payments were cash)
4. Sets default values to 0 for new columns

## Troubleshooting:

- If you get a constraint error, the migration might have partially run. Check the bookings table structure first.
- If columns already exist, the migration uses `IF NOT EXISTS` so it's safe to run again.
- After running, refresh your browser to clear any cached schema.

---

## Clearing Test Data

If you want to clear all test data from your database:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/007_clear_test_data.sql`
5. Paste it into the SQL Editor
6. **Review the script carefully** - it will delete ALL bookings, guests, and room status logs
7. Click **Run** (or press Ctrl+Enter)

**Note:** This script will:
- ✅ Delete all bookings
- ✅ Delete all guests
- ✅ Delete all room status logs
- ✅ Reset all rooms to 'available' status
- ✅ Preserve rooms and settings (settings can be reset by uncommenting the last section)

After running, your database will be clean and ready for production use.

