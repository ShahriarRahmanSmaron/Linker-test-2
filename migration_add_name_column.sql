-- Migration: Add name column to users table
-- Run this in Supabase SQL Editor if you already have an existing users table
-- This adds the name column for storing user's display name/username

-- Add name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'name'
    ) THEN
        ALTER TABLE users ADD COLUMN name VARCHAR(100);
        RAISE NOTICE 'Added name column to users table';
    ELSE
        RAISE NOTICE 'name column already exists in users table';
    END IF;
END $$;

