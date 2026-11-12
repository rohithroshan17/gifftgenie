-- Kindred marketplace schema. Apply in the Supabase SQL editor.
-- All objects are additive and use IF NOT EXISTS so existing saved_gifts data is preserved.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'maker', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.makers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  slug text unique not null,
  name text not null,
  bio text,
  location text,
  avatar_url text,
  website_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collections (
  id text primary key,
  title text not null,
  eyebrow text,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  maker_id uuid references public.makers(id) on delete set null,
  collection_id text references public.collections(id) on delete set null,
  slug text unique not null,
  name text not null,
  description text not null,
  note text,
  price numeric(10,2) not null check (price >= 0),
  price_usd numeric(10,2),
  price_inr numeric(10,2),
  original_currency text not null default 'USD',
  currency text not null default 'USD',
  category text not null,
  tags text[] not null default '{}',
  image_url text,
  accent text,
  inventory integer not null default 0 check (inventory >= 0),
  rating numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
  review_count integer not null default 0 check (review_count >= 0),
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists price_usd numeric(10,2);
alter table public.products add column if not exists price_inr numeric(10,2);
alter table public.products add column if not exists original_currency text not null default 'USD';

create table if not exists public.saved_gifts (
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id text references public.products(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'checked_out', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  primary key (cart_id, product_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'pending_payment' check (status in ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'payment_failed')),
  total numeric(10,2) not null check (total >= 0),
  currency text not null default 'USD',
  shipping_address jsonb not null default '{}',
  payment_provider text,
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  product_name text not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  primary key (order_id, product_id)
);

create table if not exists public.gift_finder_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  answers jsonb not null default '{}',
  results jsonb not null default '[]',
  source text not null default 'fallback' check (source in ('ai', 'fallback')),
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.makers enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.saved_gifts enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.gift_finder_sessions enable row level security;
alter table public.contact_messages enable row level security;

-- Profiles: users can read and edit their own profile. Role changes belong to an admin workflow.
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Public catalog is limited to approved content. Maker/admin write policies should be extended with server-side role checks.
drop policy if exists "Anyone can view approved makers" on public.makers;
create policy "Anyone can view approved makers" on public.makers for select using (status = 'approved');
drop policy if exists "Anyone can view approved products" on public.products;
create policy "Anyone can view approved products" on public.products for select using (status = 'approved');
drop policy if exists "Anyone can view collections" on public.collections;
create policy "Anyone can view collections" on public.collections for select using (true);

-- Customer-owned records.
drop policy if exists "Users can view their own saved gifts" on public.saved_gifts;
create policy "Users can view their own saved gifts" on public.saved_gifts for select using (auth.uid() = user_id);
drop policy if exists "Users can save gifts for themselves" on public.saved_gifts;
create policy "Users can save gifts for themselves" on public.saved_gifts for insert with check (auth.uid() = user_id);
drop policy if exists "Users can remove their own saved gifts" on public.saved_gifts;
create policy "Users can remove their own saved gifts" on public.saved_gifts for delete using (auth.uid() = user_id);

drop policy if exists "Users can manage their own carts" on public.carts;
create policy "Users can manage their own carts" on public.carts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can manage their own cart items" on public.cart_items;
create policy "Users can manage their own cart items" on public.cart_items for all using (exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = auth.uid())) with check (exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = auth.uid()));
drop policy if exists "Users can view their own orders" on public.orders;
create policy "Users can view their own orders" on public.orders for select using (auth.uid() = user_id);
drop policy if exists "Users can view their own order items" on public.order_items;
create policy "Users can view their own order items" on public.order_items for select using (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid()));
drop policy if exists "Users can view their own finder sessions" on public.gift_finder_sessions;
create policy "Users can view their own finder sessions" on public.gift_finder_sessions for select using (auth.uid() = user_id);
drop policy if exists "Users can create finder sessions" on public.gift_finder_sessions;
create policy "Users can create finder sessions" on public.gift_finder_sessions for insert with check (auth.uid() = user_id);
drop policy if exists "Anyone can send contact messages" on public.contact_messages;
create policy "Anyone can send contact messages" on public.contact_messages for insert with check (true);

-- Starter catalog records. These are inserted only when the IDs do not already exist,
-- so running this file does not overwrite a maker or product that has been edited later.
insert into public.collections (id, title, eyebrow, description, image_url) values
  ('small-joys', 'Small reasons to smile', 'No occasion needed', 'For the saw this and thought of you moments.', 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=85'),
  ('slow-moments', 'Make a little room', 'For the softer days', 'Gifts that turn an ordinary evening into a ritual.', 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=85'),
  ('quietly-iconic', 'Quietly iconic', 'Always a good idea', 'Beautiful things they will reach for again and again.', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85'),
  ('just-because', 'The just-because edit', 'No reason required', 'A little something for the lovely ordinary days.', 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=1200&q=85')
on conflict (id) do nothing;

insert into public.makers (id, slug, name, bio, location, status) values
  ('00000000-0000-0000-0000-000000000001', 'clay-kind', 'Clay & Kind', 'Small-batch ceramics for everyday rituals.', 'Jaipur, Rajasthan', 'approved'),
  ('00000000-0000-0000-0000-000000000002', 'sunday-rituals', 'Sunday Rituals', 'Hand-poured scents for slower evenings.', 'Bengaluru, Karnataka', 'approved'),
  ('00000000-0000-0000-0000-000000000003', 'mira-studio', 'Mira Studio', 'Quiet jewellery with a little individuality.', 'Mumbai, Maharashtra', 'approved'),
  ('00000000-0000-0000-0000-000000000004', 'kindred-edit', 'Kindred Edit', 'A rotating edit of small maker-made favourites.', 'Curated with care', 'approved')
on conflict (id) do nothing;

insert into public.products (id, maker_id, collection_id, slug, name, description, note, price, category, tags, image_url, accent, inventory, rating, review_count, status) values
  ('wildflower-vase', '00000000-0000-0000-0000-000000000001', 'small-joys', 'wildflower-bud-vase', 'Wildflower bud vase', 'A tiny, hand-thrown reminder to notice the little things.', 'For the person who keeps a flower in every room.', 38, 'Home', array['handmade','home','under $30'], 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85', 'ochre', 24, 4.9, 46, 'approved'),
  ('candle-set', '00000000-0000-0000-0000-000000000002', 'slow-moments', 'a-little-moment-candle-set', 'A little moment candle set', 'Three small scents for the days that deserve a pause.', 'For a friend who needs a softer evening.', 32, 'Wellness', array['self-care','hand-poured','under $60'], 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85', 'lilac', 31, 4.8, 32, 'approved'),
  ('pearl-pendant', '00000000-0000-0000-0000-000000000003', 'quietly-iconic', 'everyday-pearl-pendant', 'Everyday pearl pendant', 'A luminous freshwater pearl, made for every day.', 'For the one whose style never tries too hard.', 64, 'Jewellery', array['jewellery','keepsake','under $100'], 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=85', 'sage', 12, 5.0, 28, 'approved'),
  ('linen-journal', '00000000-0000-0000-0000-000000000004', 'small-joys', 'the-good-ideas-journal', 'The good ideas journal', 'A linen-bound place for thoughts worth keeping.', 'For the collector of lists, dreams, and side quests.', 24, 'Stationery', array['paper goods','for creatives','under $30'], 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=85', 'terracotta', 44, 4.9, 57, 'approved'),
  ('wildflower-note-cards', '00000000-0000-0000-0000-000000000004', 'small-joys', 'wildflower-note-cards', 'Wildflower note cards', 'A small set of illustrated cards for saying the thing in your own handwriting.', 'For the friend who still sends the best messages on paper.', 16, 'Stationery', array['birthday','writing','paper goods','under $20'], 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=85', 'marigold', 60, 4.8, 24, 'approved'),
  ('tea-trio', '00000000-0000-0000-0000-000000000004', 'slow-moments', 'three-quiet-teas', 'Three quiet teas', 'A considered trio for long conversations and slow mornings.', 'For the one who makes a ritual out of tea.', 29, 'Food & drink', array['tea','for hosts','under $30'], 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=900&q=85', 'forest', 28, 4.8, 18, 'approved'),
  ('sun-catcher', '00000000-0000-0000-0000-000000000001', 'small-joys', 'sun-catcher-small', 'Sun catcher, small', 'A little prism of light for a favourite corner.', 'For making ordinary rooms feel a little more alive.', 42, 'Home', array['home','handmade','under $60'], 'https://images.unsplash.com/photo-1507643179773-3e975d7ac515?auto=format&fit=crop&w=900&q=85', 'marigold', 17, 4.9, 21, 'approved'),
  ('silk-scarf', '00000000-0000-0000-0000-000000000004', 'quietly-iconic', 'the-easy-silk-scarf', 'The easy silk scarf', 'A generous silk square in a colour that goes everywhere.', 'For the one who always adds the final touch.', 58, 'Wearables', array['textiles','keepsake','under $60'], 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85', 'indigo', 9, 4.7, 19, 'approved'),
  ('weekend-box', '00000000-0000-0000-0000-000000000004', 'just-because', 'the-just-because-box', 'The just-because box', 'A little of everything lovely, wrapped up for no particular reason.', 'For a message that does not need a special occasion.', 76, 'Curated sets', array['curated','best seller','under $100'], 'https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=900&q=85', 'coral', 8, 4.9, 14, 'approved')
on conflict (id) do nothing;

-- The repository catalog stores its source price in USD. Refresh price_inr from the
-- live exchange-rate job when syncing the catalog; 83.5 is only the seed value.
update public.products
set price_usd = price,
    price_inr = round(price * 83.5, 0),
    original_currency = 'USD'
where price_usd is null;
