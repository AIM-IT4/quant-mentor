# Supabase Setup Commands

-- 1. Create the Products Table
create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text,
  price numeric not null default 0,
  file_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table products enable row level security;

-- 3. Create Policy: Allow Public Read Access (Everyone can see products)
create policy "Public products are viewable by everyone"
  on products for select
  using ( true );

-- 4. Create Policy: Allow Public Insert/Update (For Admin Panel - Simplified)
-- In a real app, you would restrict this to authenticated users only.
-- For this simple implementation, we'll allow it but you should keep your Anon Key secret
-- or add a hardcoded "admin_secret" check if possible.
create policy "Enable insert for everyone"
  on products for insert
  with check ( true );

create policy "Enable update for everyone"
  on products for update
  using ( true );

-- 5. Create Storage Bucket
insert into storage.buckets (id, name, public)
values ('resources', 'resources', true);

-- 6. Storage Policies (Allow Public Access to 'resources' bucket)
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'resources' );

create policy "Public Upload"
  on storage.objects for insert
  with check ( bucket_id = 'resources' );
