-- ============================================================================
-- Migration 018: Free Hike support (Sprint UX-1)
-- Allow user_activities without a predefined trail (rando libre)
-- ============================================================================

-- Make trail_id nullable for free hikes
ALTER TABLE user_activities ALTER COLUMN trail_id DROP NOT NULL;

-- Drop the unique constraint (user can have multiple free hikes)
ALTER TABLE user_activities DROP CONSTRAINT IF EXISTS user_activities_user_id_trail_id_key;

-- Add custom_name for free hikes
ALTER TABLE user_activities ADD COLUMN IF NOT EXISTS custom_name TEXT;

-- Add validation_type 'free' support
ALTER TABLE user_activities DROP CONSTRAINT IF EXISTS user_activities_validation_type_check;
ALTER TABLE user_activities ADD CONSTRAINT user_activities_validation_type_check
  CHECK (validation_type IN ('gps', 'manual', 'free'));
