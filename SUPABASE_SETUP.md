# Supabase Auth Setup

## 1. Environment variables

Create a local `.env` file from [.env.example](C:\Users\danah\OneDrive\Desktop\Projects\HealthisWealth\.env.example):

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_APP_URL=https://www.vitalyxapp.com
```

Set the same values in your hosting provider before deploying.

## 2. Run the database schema

In the Supabase SQL editor, run [supabase/schema.sql](C:\Users\danah\OneDrive\Desktop\Projects\HealthisWealth\supabase\schema.sql).

That creates:

- `profiles`
- `user_app_data`
- a trigger that creates both records when a new auth user is created
- Row Level Security policies so users only access their own rows

The `profiles` table now also owns:

- `role` with `user` or `admin`
- `subscription_tier` with `free` or `premium`

## 3. Supabase Auth settings

Enable Email auth in Supabase Auth.

Recommended production settings:

- Enable email confirmations
- Set the site URL to `https://www.vitalyxapp.com`
- Add your localhost dev URL and production domain to Redirect URLs

Suggested redirect URLs:

- `http://127.0.0.1:5173/`
- `https://www.vitalyxapp.com/`
- `https://vitalyxapp.com/`

## 4. Managing admins from Supabase tables

Admins are now managed from the `profiles` table instead of an environment variable.

To promote an existing user to admin in Supabase SQL:

```sql
update public.profiles
set role = 'admin',
    subscription_tier = 'premium'
where email = 'you@example.com';
```

## 5. Deployment notes

- Only expose the public anon key in the frontend
- Never ship the service-role key to the client
- Make sure your live domain is added in Supabase Auth redirect settings
- Build with `npm run web:build`
