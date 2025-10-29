# Supabase Database Setup

## Instructions

Your app is configured to use Supabase database. To create the required tables:

1. **Go to your Supabase SQL Editor:**
   - Visit: https://tmmqzpybrhmjutotvmxn.supabase.co/project/_/sql/new

2. **Paste and run this SQL:**

```sql
-- Create links table
CREATE TABLE IF NOT EXISTS links (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  url TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create clicks table
CREATE TABLE IF NOT EXISTS clicks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  link_id VARCHAR REFERENCES links(id),
  clicked_by TEXT,
  user_agent TEXT,
  clicked_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
```

3. **Click "Run" to execute the SQL**

4. **Restart the application** - The app will now connect to Supabase successfully!

## Verification

After running the SQL, you should see two tables created:
- `links` - Stores submitted mystery links
- `clicks` - Stores click activity

The app uses these environment variables (already configured):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`  
- `DATABASE_URL` - PostgreSQL connection string
