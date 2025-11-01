-- Create button_ownerships table for time-based ownership tracking
CREATE TABLE IF NOT EXISTS button_ownerships (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  owner_address TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  starts_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 3600,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create links table
CREATE TABLE IF NOT EXISTS links (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ownership_id VARCHAR REFERENCES button_ownerships(id),
  url TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  submitter_username TEXT,
  submitter_pfp_url TEXT,
  tx_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create clicks table
CREATE TABLE IF NOT EXISTS clicks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  link_id VARCHAR REFERENCES links(id),
  clicked_by TEXT,
  clicker_username TEXT,
  clicker_pfp_url TEXT,
  user_agent TEXT,
  clicked_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add missing columns to existing tables (safe to run multiple times)
ALTER TABLE links ADD COLUMN IF NOT EXISTS ownership_id VARCHAR REFERENCES button_ownerships(id);
ALTER TABLE links ADD COLUMN IF NOT EXISTS submitter_username TEXT;
ALTER TABLE links ADD COLUMN IF NOT EXISTS submitter_pfp_url TEXT;
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS clicker_username TEXT;
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS clicker_pfp_url TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_button_ownerships_expires_at ON button_ownerships(expires_at);
CREATE INDEX IF NOT EXISTS idx_button_ownerships_owner_address ON button_ownerships(owner_address);
CREATE INDEX IF NOT EXISTS idx_links_ownership_id ON links(ownership_id);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
