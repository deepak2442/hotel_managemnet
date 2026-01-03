# Hotel Management System

A comprehensive hotel management system built with React, TypeScript, TailwindCSS, and Supabase.

## Features

- **Room Management**: Visual dashboard showing all rooms with real-time status updates
- **Check-In/Check-Out**: Complete guest check-in and check-out workflow
- **Guest Management**: Store guest information with ID proof verification
- **Payment Tracking**: Track payments with GST calculation
- **Cleaning Status**: Track room cleaning status after check-out
- **Reports**: Daily, monthly, and yearly reports with revenue and occupancy tracking
- **Authentication**: Secure login system for receptionists/admins

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: TailwindCSS
- **Backend**: Supabase (Database, Authentication, Realtime)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Routing**: React Router

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration file: `supabase/migrations/001_initial_schema.sql`
3. Copy your project URL and anon key from Settings > API

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Development Server

```bash
npm run dev
```

## Room Configuration

The system is pre-configured with the following rooms:

- **Ground Floor**: 9 standard rooms (Rooms 1-9, max 2 guests)
- **First Floor**: 
  - Rooms 10, 11, 12 (standard, max 2 guests)
  - Room 13 (dormitory, maintenance - not for guests)
  - Room 14 (deluxe, max 2 guests)
- **Cottages**: 
  - 15A (cottage), 15B (deluxe), 16-21 (deluxe, max 2 guests each)

## Usage

1. **Login**: Use your Supabase authentication credentials
2. **Dashboard**: View all rooms and their current status
3. **Check-In**: Click on an available room to check in a guest
4. **Check-Out**: View active bookings and process check-outs
5. **Reports**: Generate daily, monthly, or yearly reports

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
├── hooks/          # Custom React hooks
├── lib/            # Utilities and configurations
├── context/        # React context providers
└── App.tsx         # Main app component
```

## Deployment to Vercel

### Prerequisites

1. A GitHub account
2. A Vercel account (sign up at [vercel.com](https://vercel.com))
3. Your Supabase project URL and anon key

### Deployment Steps

#### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-github-repo-url
   git push -u origin main
   ```

2. **Import project to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite framework

3. **Configure Environment Variables**
   - In Vercel project settings, go to "Environment Variables"
   - Add the following variables:
     - `VITE_SUPABASE_URL` = your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - Make sure to add them for all environments (Production, Preview, Development)

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your app automatically
   - Your app will be live at `your-project.vercel.app`

#### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

5. **Redeploy with environment variables**
   ```bash
   vercel --prod
   ```

### Environment Variables

Create a `.env` file locally (for development) or set them in Vercel dashboard:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important**: Never commit `.env` files to Git. They are already in `.gitignore`.

### Post-Deployment

1. **Update Supabase RLS Policies** (if needed)
   - Ensure your Supabase Row Level Security policies allow access from your Vercel domain
   - You may need to add your Vercel domain to Supabase allowed origins

2. **Test the deployment**
   - Visit your Vercel URL
   - Test login functionality
   - Verify all features work correctly

### Troubleshooting

- **Build fails**: Check that all dependencies are in `package.json`
- **Environment variables not working**: Ensure variables are prefixed with `VITE_` for Vite projects
- **404 errors on routes**: The `vercel.json` file handles SPA routing with rewrites
- **Supabase connection issues**: Verify your environment variables are set correctly in Vercel

## License

MIT
