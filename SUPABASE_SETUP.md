# Supabase Auth Setup

## 1. Environment variables

Create a local `.env` file from [.env.example](C:\Users\danah\OneDrive\Desktop\Projects\HealthisWealth\.env.example):

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_ADMIN_EMAIL=admin@example.com
```

Set the same values in your hosting provider before deploying.

## 2. Run the database schema

In the Supabase SQL editor, run [supabase/schema.sql](C:\Users\danah\OneDrive\Desktop\Projects\HealthisWealth\supabase\schema.sql).

That creates:

- `profiles`
- `user_app_data`
- a trigger that creates both records when a new auth user is created
- Row Level Security policies so users only access their own rows

## 3. Supabase Auth settings

Enable Email auth in Supabase Auth.

Recommended production settings:

- Enable email confirmations
- Set the site URL to your production domain
- Add your localhost dev URL and production domain to Redirect URLs

Suggested redirect URLs:

- `http://127.0.0.1:5173/`
- your production domain root URL

## 4. Deployment notes

- Only expose the public anon key in the frontend
- Never ship the service-role key to the client
- Make sure your live domain is added in Supabase Auth redirect settings
- Build with `npm run web:build`
