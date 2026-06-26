-- Run this in the Supabase SQL editor (Dashboard -> SQL).
-- It creates the product catalog the planner reads from, plus a table for
-- saved plans. The app works without this (it falls back to the bundled
-- seed catalog) — wire this up when you're ready to manage products in a DB.

create table if not exists products (
  id          text primary key,
  title       text not null,
  category    text not null check (category in
              ('decor','tableware','lighting','favors','activities','food_drink')),
  price       numeric not null,
  unit        text,
  color_tags  text[] not null default '{}',
  style_tags  text[] not null default '{}',
  buy_url     text,
  created_at  timestamptz not null default now()
);

create table if not exists plans (
  id          uuid primary key default gen_random_uuid(),
  brief       jsonb not null,
  budget      numeric not null,
  plan        jsonb not null,
  created_at  timestamptz not null default now()
);

-- Let the public app read the catalog (read-only). Writes stay server-side.
alter table products enable row level security;
create policy "public read products"
  on products for select
  to anon
  using (true);

-- To load the starter catalog into Supabase, open data/seed-catalog.json and
-- use the Table editor's "Import data" on the products table, or convert it to
-- INSERT statements. The column names match the JSON keys.
