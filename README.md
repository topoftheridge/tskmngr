# tskmngr

Private task manager for internal use. Built with Next.js (App Router), Supabase, and Tailwind CSS.

## Features

- Login/signup authentication via Supabase Auth
- Dashboard with task stats, upcoming deadlines, and assigned tasks
- Kanban board with drag-and-drop (Backlog → Planning → In Progress → Waiting → Done)
- Create, edit, delete, and move tasks
- Task fields: title, description, status, priority, assignee, due date, project
- Comments on tasks
- Project/client filtering and search
- Mobile responsive

## Setup

### 1. Supabase

1. Go to your [Supabase project](https://knfyqbzvcysywkylrnjq.supabase.co)
2. Open the **SQL Editor**
3. Paste and run the contents of `supabase-schema.sql`
4. In **Authentication → Settings**, make sure email auth is enabled

### 2. Environment Variables

Copy the example and fill in your anon key:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://knfyqbzvcysywkylrnjq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
```

Find your anon key at: **Supabase Dashboard → Settings → API**

### 3. Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### 5. Custom Domain

To connect a subdomain (e.g., `tasks.topridgemarketing.com`):

1. In Vercel → Project Settings → Domains, add `tasks.topridgemarketing.com`
2. In your DNS provider, create a **CNAME** record:
   - Name: `tasks` (or `ops`)
   - Value: `cname.vercel-dns.com`
3. Wait for SSL provisioning (usually a few minutes)

## Tech Stack

- **Next.js 15** (App Router)
- **Supabase** (Auth + PostgreSQL)
- **Tailwind CSS**
- **@hello-pangea/dnd** (drag and drop)
- **TypeScript**
