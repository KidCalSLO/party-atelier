# Party Atelier

Describe the party you want and your budget → get a styled, budget-fit plan and a
real shopping list. This is the MVP "magic loop": parse desires → split budget →
match products → preview.

## How it works

```
desires (text + optional inspo photo)
        │
        ▼
  Job 1  parse intent        → lib/anthropic.ts   (Claude, structured output)
  Job 2  split budget        → lib/budget.ts      (rules)
         match products      → lib/catalog.ts     (Supabase or seed catalog)
  Job 3  preview             → lib/render.ts      (mood board now; image API later)
        │
        ▼
  /api/generate  →  the plan UI (app/page.tsx)
```

## Run it locally (5 minutes)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` from the template and add your Anthropic key:
   ```bash
   cp .env.example .env.local
   ```
   Get a key at https://console.anthropic.com → API Keys. The only required
   value to see it work is `ANTHROPIC_API_KEY`.
3. Start the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000, describe a party, set a budget, hit **Plan my party**.

It runs against the bundled `data/seed-catalog.json` until you connect Supabase.

## Connect Supabase (catalog + saved plans)

1. Create a project at https://supabase.com.
2. In the SQL editor, run `supabase/schema.sql`.
3. Import `data/seed-catalog.json` into the `products` table (Table editor →
   Import data), or convert it to INSERTs.
4. Put your project URL and anon key into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
The app automatically reads from Supabase when those are set.

## Earn on the shopping list (Model C, phase 1)

Set `AFFILIATE_TAG` and (optionally) `AFFILIATE_URL_TEMPLATE` in `.env.local`.
Each "Shop this" button is a retailer search link with your tag appended. Start
with an affiliate network you can join today (Impact / ShareASale / CJ, or
Amazon Associates once eligible), then later bring your top SKUs in-house with
Stripe checkout.

## Real product photos, prices, and links (live shopping API)

By default the planner uses the bundled seed catalog with representative photos.
To show **real products** — real photos, live prices sorted to the best deal, and
direct buy links — add a shopping-API key:

1. Sign up for a Google Shopping API (e.g. https://serpapi.com has a free tier).
2. Put the key in `.env.local` (and in Vercel's Environment Variables):
   ```
   PRODUCT_API_KEY=your_key_here
   ```
The app switches to live products automatically and falls back to the seed catalog
for any category the API can't fill. Each plan makes up to ~6 shopping searches, so
mind your plan's monthly search quota. Note: live buy links go straight to the
merchant and aren't affiliate-attributed — wrap them in your affiliate network's
deep links later to earn on live results.

## Add real renders (Job 3)

Set `IMAGE_API_KEY` and implement `generateImage()` in `lib/render.ts` with your
image provider. Return the hosted image URL; the UI already shows it when present.

## Deploy to Vercel

1. Push this folder to a new GitHub repo.
2. In Vercel, "Add New → Project", import the repo.
3. Add the same environment variables from `.env.local` in
   Project → Settings → Environment Variables.
4. Deploy. Every push to `main` redeploys.

## Next steps

- Turn on the optional "curate queries" Claude call for sharper matching.
- Let users edit the brief ("more boho, raise budget to $400") and re-generate.
- Save plans to the `plans` table and add shareable links.
