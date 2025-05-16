-- Table for campaign invitations
CREATE TABLE IF NOT EXISTS campaign_invitations (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'player',
  status TEXT NOT NULL DEFAULT 'pending',
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  expires_at TEXT,
  used_at TEXT,
  max_uses INTEGER DEFAULT 1,
  use_count INTEGER DEFAULT 0,
  notes TEXT
);

-- Table for DM private notes
CREATE TABLE IF NOT EXISTS dm_notes (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT TRUE,
  related_entity_type TEXT,
  related_entity_id INTEGER,
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  updated_at TEXT
);

-- Update campaign_participants table to add observer role capability
ALTER TABLE campaign_participants ADD COLUMN IF NOT EXISTS permissions TEXT DEFAULT 'standard';