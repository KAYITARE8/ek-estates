create table if not exists public.properties (
  id text primary key,
  title text not null,
  type text not null,
  status text not null,
  price numeric not null default 0,
  currency text not null default 'RWF',
  location text not null default '',
  district text not null default '',
  bedrooms integer not null default 0,
  bathrooms integer not null default 0,
  area numeric not null default 0,
  description text not null default '',
  features jsonb not null default '[]'::jsonb,
  image text not null default '',
  featured boolean not null default false,
  created_at date not null default current_date
);

create table if not exists public.agents (
  id text primary key,
  name text not null,
  role text not null default '',
  phone text not null default '',
  email text not null default '',
  photo text not null default ''
);

create table if not exists public.inquiries (
  id text primary key,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  message text not null default '',
  property_title text not null default 'General Inquiry',
  is_read boolean not null default false,
  is_done boolean not null default false,
  date timestamptz not null default now()
);

create table if not exists public.settings (
  id text primary key,
  company_name text not null default 'ek estates',
  tagline text not null default '',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  whatsapp text not null default '',
  about text not null default ''
);

create table if not exists public.orders (
  id text primary key,
  customer jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  payment_method text not null default '',
  notes text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id text primary key,
  name text not null,
  email text not null unique,
  password text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admins (
  id text primary key,
  username text not null unique,
  password text not null,
  name text not null default 'Administrator',
  photo text not null default ''
);

alter table public.properties enable row level security;
alter table public.agents enable row level security;
alter table public.inquiries enable row level security;
alter table public.settings enable row level security;
alter table public.orders enable row level security;
alter table public.users enable row level security;
alter table public.admins enable row level security;
