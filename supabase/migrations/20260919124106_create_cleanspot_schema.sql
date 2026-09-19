/*
# CleanSpot — Initial Schema + Seed Data

Creates the full data model for a Public Toilet & Water ATM Locator
focused on Kanniyakumari district, Tamil Nadu.

## Tables

1. **locations** — public toilets and water ATMs
   - id (uuid, PK)
   - name (text)
   - type (text: 'toilet' | 'water_atm')
   - latitude (numeric)
   - longitude (numeric)
   - tags (text[] — e.g. 'women_friendly','free','paid','wheelchair_accessible')
   - created_at (timestamptz, default now())
   - created_by_session (text — lightweight session id of the user who added it)

2. **ratings** — crowd-sourced cleanliness ratings
   - id (uuid, PK)
   - location_id (uuid FK → locations, ON DELETE CASCADE)
   - stars (int, 1–5, check constraint)
   - comment (text, nullable)
   - photo_url (text, nullable)
   - reviewer_lat (numeric, nullable)
   - reviewer_lng (numeric, nullable)
   - session_id (text — which anonymous user submitted)
   - created_at (timestamptz, default now())

3. **status_reports** — real-time status + water availability
   - id (uuid, PK)
   - location_id (uuid FK → locations, ON DELETE CASCADE)
   - status (text: 'working' | 'locked' | 'maintenance')
   - water_available (text: 'true' | 'false' | 'unknown')
   - session_id (text)
   - created_at (timestamptz, default now())
   NOTE: 6-hour auto-expiry is handled in application logic (any report
   older than 6 hours is treated as "Unverified").

4. **app_users** — lightweight anonymous session-based users
   - id (text, PK — a generated session id)
   - review_count (int, default 0)
   - badges (text[] — e.g. 'pioneer_reviewer')
   - created_at (timestamptz, default now())

## Seed Data

6 starting reference points in Kanniyakumari district. These are
landmark-area approximations, NOT officially verified coordinates.
They are labelled as "starting reference points, refined by community"
in the UI.

## Security (RLS)

This is a no-auth, public crowd-sourcing app — the frontend uses the
anon key. All policies use `TO anon, authenticated` with `USING (true)`
/ `WITH CHECK (true)` because every row is intentionally shared/public.
RLS is still enabled so the tables are not accidentally writable by
other roles.
*/

-- ======================== LOCATIONS ========================
CREATE TABLE IF NOT EXISTS locations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  type          text NOT NULL CHECK (type IN ('toilet', 'water_atm')),
  latitude      numeric NOT NULL,
  longitude     numeric NOT NULL,
  tags          text[] NOT NULL DEFAULT '{}',
  created_by_session text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_locations" ON locations;
CREATE POLICY "anon_select_locations" ON locations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_locations" ON locations;
CREATE POLICY "anon_insert_locations" ON locations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_locations" ON locations;
CREATE POLICY "anon_update_locations" ON locations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_locations" ON locations;
CREATE POLICY "anon_delete_locations" ON locations FOR DELETE
  TO anon, authenticated USING (true);

-- ======================== RATINGS ========================
CREATE TABLE IF NOT EXISTS ratings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id   uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  stars         int NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment       text,
  photo_url     text,
  reviewer_lat  numeric,
  reviewer_lng  numeric,
  session_id    text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ratings" ON ratings;
CREATE POLICY "anon_select_ratings" ON ratings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_ratings" ON ratings;
CREATE POLICY "anon_insert_ratings" ON ratings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_ratings" ON ratings;
CREATE POLICY "anon_update_ratings" ON ratings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_ratings" ON ratings;
CREATE POLICY "anon_delete_ratings" ON ratings FOR DELETE
  TO anon, authenticated USING (true);

-- ======================== STATUS_REPORTS ========================
CREATE TABLE IF NOT EXISTS status_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id     uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  status          text NOT NULL CHECK (status IN ('working', 'locked', 'maintenance')),
  water_available text NOT NULL DEFAULT 'unknown' CHECK (water_available IN ('true', 'false', 'unknown')),
  session_id      text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE status_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_status_reports" ON status_reports;
CREATE POLICY "anon_select_status_reports" ON status_reports FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_status_reports" ON status_reports;
CREATE POLICY "anon_insert_status_reports" ON status_reports FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_status_reports" ON status_reports;
CREATE POLICY "anon_update_status_reports" ON status_reports FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_status_reports" ON status_reports;
CREATE POLICY "anon_delete_status_reports" ON status_reports FOR DELETE
  TO anon, authenticated USING (true);

-- ======================== APP_USERS ========================
CREATE TABLE IF NOT EXISTS app_users (
  id            text PRIMARY KEY,
  review_count  int NOT NULL DEFAULT 0,
  badges        text[] NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_app_users" ON app_users;
CREATE POLICY "anon_select_app_users" ON app_users FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_app_users" ON app_users;
CREATE POLICY "anon_insert_app_users" ON app_users FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_app_users" ON app_users;
CREATE POLICY "anon_update_app_users" ON app_users FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_app_users" ON app_users;
CREATE POLICY "anon_delete_app_users" ON app_users FOR DELETE
  TO anon, authenticated USING (true);

-- ======================== INDEXES ========================
CREATE INDEX IF NOT EXISTS idx_ratings_location_id ON ratings(location_id);
CREATE INDEX IF NOT EXISTS idx_status_reports_location_id ON status_reports(location_id);

-- ======================== SEED DATA ========================
-- Only insert if the table is empty (idempotent re-run guard).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM locations) THEN
    INSERT INTO locations (name, type, latitude, longitude, tags) VALUES
      ('Nagercoil Bus Stand area', 'toilet',     8.1778, 77.4344, ARRAY['free']),
      ('Nagercoil Railway Station area', 'water_atm', 8.1735, 77.4291, ARRAY['paid','wheelchair_accessible']),
      ('Kottar, Nagercoil',           'toilet',     8.1823, 77.4368, ARRAY['free','women_friendly']),
      ('Vadasery, Nagercoil',         'water_atm',  8.1721, 77.4459, ARRAY['free']),
      ('Kanniyakumari Beach / town area', 'toilet', 8.0883, 77.5385, ARRAY['paid']),
      ('Konam, Nagercoil',            'water_atm',  8.1623, 77.4094, ARRAY['wheelchair_accessible']);
  END IF;
END $$;
