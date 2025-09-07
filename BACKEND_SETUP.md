# Backend Setup Guide - Supabase Integration

This guide will help you set up a free Supabase backend for your Shabbat Apartment Program application.

## 🚀 Quick Start

### Step 1: Create Supabase Account and Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" and sign up for a free account
3. Click "New Project"
4. Choose your organization (or create one)
5. Fill in project details:
   - **Name**: `shabbat-apartment-program` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest to your users
6. Click "Create new project"
7. Wait for the project to be created (2-3 minutes)

### Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

### Step 3: Configure Your Application

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase-schema.sql` file
4. Paste it into the SQL editor
5. Click "Run" to execute the schema

This will create all the necessary tables, relationships, and security policies.

### Step 5: Configure Authentication

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Under **Site URL**, add your application URL:
   - For development: `http://localhost:5173`
   - For production: your actual domain
3. Under **Redirect URLs**, add the same URLs
4. **Disable email confirmation** for easier testing:
   - Go to **Authentication** → **Settings** → **Email**
   - Uncheck "Enable email confirmations"

### Step 6: Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:5173`

3. Try creating a new account:
   - Click "Don't have an account? Sign up"
   - Enter an email, password, and preferred name
   - Click "Create account"

4. Try logging in with your new account

## 🔧 Advanced Configuration

### Row Level Security (RLS)

The database is configured with Row Level Security policies that ensure:
- Users can only see their own data
- Admins can see all data
- Proper access control for all operations

### Database Schema

The application uses these main tables:
- `users` - User accounts and profiles
- `month_logs` - Monthly progress tracking
- `meal_logs` - Meal attendance records
- `learning_sessions` - Learning time tracking
- `shabbatons` - Shabbaton events
- `attendances` - Shabbaton attendance requests
- `uws_rsvps` - UWS RSVP tracking

### Environment Variables

Make sure these are set in your `.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables in Vercel dashboard
5. Deploy!

### Option 2: Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Connect your GitHub repository
4. Add environment variables in Netlify dashboard
5. Deploy!

### Option 3: GitHub Pages

1. Build your project: `npm run build`
2. Push the `dist` folder to a `gh-pages` branch
3. Enable GitHub Pages in repository settings

## 🔒 Security Features

- **Authentication**: Secure user login/signup with Supabase Auth
- **Row Level Security**: Database-level access control
- **Password Protection**: Secure password hashing
- **Session Management**: Automatic session handling
- **Data Validation**: Input validation and sanitization

## 📊 Monitoring and Analytics

Supabase provides built-in monitoring:
- **Database**: Query performance and usage
- **Authentication**: User signups and logins
- **API**: Request logs and errors
- **Storage**: File uploads and usage

## 🆓 Free Tier Limits

Supabase free tier includes:
- **Database**: 500MB storage
- **Bandwidth**: 2GB/month
- **API Requests**: 50,000/month
- **Authentication**: Unlimited users
- **Real-time**: 200 concurrent connections

## 🐛 Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check that `.env.local` exists and has correct values
   - Restart your development server

2. **"Invalid login credentials"**
   - Make sure email confirmation is disabled in Supabase
   - Check that the user exists in the database

3. **"Row Level Security policy violation"**
   - Check that the user is properly authenticated
   - Verify RLS policies are correctly set up

4. **Database connection errors**
   - Verify your Supabase URL and API key
   - Check that the database is running

### Getting Help

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Supabase Discord**: [discord.supabase.com](https://discord.supabase.com)
- **GitHub Issues**: Create an issue in your repository

## 🎉 You're All Set!

Your Shabbat Apartment Program now has a fully functional backend with:
- ✅ User authentication and management
- ✅ Persistent data storage
- ✅ Real-time capabilities
- ✅ Security and access control
- ✅ Scalable infrastructure

The application will now persist data between sessions and support multiple users with proper authentication!

