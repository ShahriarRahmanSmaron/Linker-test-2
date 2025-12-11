-- ============================================
-- COMPLETE SUPABASE SETUP SCRIPT
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: ALLOWED COMPANIES TABLE
-- ============================================
-- Stores email domains that automatically grant verified buyer status
CREATE TABLE IF NOT EXISTS allowed_companies (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_allowed_companies_domain ON allowed_companies(domain);

-- ============================================
-- PART 2: USERS TABLE
-- ============================================
-- Extends Supabase auth.users with application-specific fields
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(256),  -- Nullable for Supabase auth users, required for admin
    role VARCHAR(20) DEFAULT 'general_user' NOT NULL,  -- buyer, manufacturer, admin, general_user
    company_name VARCHAR(100),
    
    -- Supabase Integration
    supabase_uid UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Approval and Verification
    approval_status VARCHAR(20) DEFAULT 'none' NOT NULL,  -- pending, approved, rejected, none
    is_verified_buyer BOOLEAN DEFAULT FALSE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_supabase_uid ON users(supabase_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);

-- ============================================
-- PART 3: FABRIC TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fabric (
    id SERIAL PRIMARY KEY,
    ref VARCHAR(255) NOT NULL,
    fabric_group VARCHAR(255),
    fabrication VARCHAR(255),
    gsm INTEGER,
    width VARCHAR(50),
    composition VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    manufacturer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    meta_data JSONB,
    image_path VARCHAR(255),  -- Path to image on local server, not Supabase storage
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fabric_ref ON fabric(ref);
CREATE INDEX IF NOT EXISTS idx_fabric_status ON fabric(status);
CREATE INDEX IF NOT EXISTS idx_fabric_manufacturer_id ON fabric(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_fabric_fabric_group ON fabric(fabric_group);

-- ============================================
-- PART 4: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can see their own record
CREATE POLICY "Users can view own record"
    ON users FOR SELECT
    USING (auth.uid() = supabase_uid);

-- Users can update their own record (limited fields)
-- Users can update their own record (STRICT: company_name only)
-- FIXED: Prevent privilege escalation by restricting updateable columns
CREATE POLICY "Users can update own company_name"
    ON users FOR UPDATE
    USING (auth.uid() = supabase_uid)
    WITH CHECK (auth.uid() = supabase_uid);

-- ENFORCE COLUMN SECURITY (Postgres Level)
-- Even if RLS passes, deny updates to sensitive columns like 'role'
-- Note: You must run this in the SQL Editor as it changes permissions
REVOKE UPDATE ON users FROM authenticated;
GRANT UPDATE (company_name) ON users TO authenticated;

-- Service role (backend) can do everything
CREATE POLICY "Service role has full access"
    ON users FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Enable RLS on fabric table
ALTER TABLE fabric ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view LIVE fabrics
CREATE POLICY "Authenticated users can view LIVE fabrics"
    ON fabric FOR SELECT
    USING (status = 'LIVE' AND auth.role() = 'authenticated');

-- Manufacturers can view their own fabrics (any status)
CREATE POLICY "Manufacturers can view own fabrics"
    ON fabric FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = fabric.manufacturer_id
            AND users.supabase_uid = auth.uid()
            AND users.role = 'manufacturer'
        )
    );

-- Manufacturers can insert their own fabrics
CREATE POLICY "Manufacturers can insert own fabrics"
    ON fabric FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = fabric.manufacturer_id
            AND users.supabase_uid = auth.uid()
            AND users.role = 'manufacturer'
            AND users.approval_status = 'approved'
        )
    );

-- Manufacturers can update their own fabrics
CREATE POLICY "Manufacturers can update own fabrics"
    ON fabric FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = fabric.manufacturer_id
            AND users.supabase_uid = auth.uid()
            AND users.role = 'manufacturer'
            AND users.approval_status = 'approved'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = fabric.manufacturer_id
            AND users.supabase_uid = auth.uid()
            AND users.role = 'manufacturer'
            AND users.approval_status = 'approved'
        )
    );

-- Service role (backend) has full access
CREATE POLICY "Service role has full fabric access"
    ON fabric FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- PART 5: TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fabric_updated_at
    BEFORE UPDATE ON fabric
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 6: AUTO-VERIFICATION TRIGGER
-- ============================================
-- This trigger automatically sets is_verified_buyer=True when a user signs up
-- if their email domain matches an entry in the allowed_companies table

CREATE OR REPLACE FUNCTION auto_verify_buyer()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    email_domain TEXT;
    user_role TEXT;
    requested_role TEXT;
    existing_user_id INTEGER;
BEGIN
    -- Extract email domain from new auth user (more reliable method)
    email_domain := LOWER(SPLIT_PART(NEW.email, '@', 2));
    
    -- Get requested role from user metadata (set during signup)
    requested_role := COALESCE(NEW.raw_user_meta_data->>'requested_role', 'buyer');
    
    -- Check if user already exists by email (for cases where email exists but supabase_uid doesn't match)
    SELECT id INTO existing_user_id FROM users WHERE email = NEW.email LIMIT 1;
    
    -- Check if domain exists in allowed_companies table
    IF EXISTS (SELECT 1 FROM allowed_companies WHERE domain = email_domain) THEN
        -- Domain is in whitelist - create/update user record with verified buyer status
        IF existing_user_id IS NOT NULL THEN
            -- Update existing user
            UPDATE users SET
                supabase_uid = NEW.id,
                role = CASE 
                    WHEN requested_role = 'manufacturer' THEN 'manufacturer'
                    ELSE 'buyer'
                END,
                is_verified_buyer = CASE 
                    WHEN requested_role = 'manufacturer' THEN FALSE
                    ELSE TRUE
                END,
                approval_status = CASE 
                    WHEN requested_role = 'manufacturer' THEN 'pending'
                    ELSE 'none'
                END,
                company_name = COALESCE(NEW.raw_user_meta_data->>'company_name', company_name)
            WHERE id = existing_user_id;
        ELSE
            -- Insert new user
            INSERT INTO users (
                email,
                supabase_uid,
                role,
                is_verified_buyer,
                approval_status,
                company_name
            ) VALUES (
                NEW.email,
                NEW.id,
                CASE 
                    WHEN requested_role = 'manufacturer' THEN 'manufacturer'
                    ELSE 'buyer'
                END,
                CASE 
                    WHEN requested_role = 'manufacturer' THEN FALSE  -- Manufacturers need approval
                    ELSE TRUE  -- Buyers with whitelisted domain are auto-verified
                END,
                CASE 
                    WHEN requested_role = 'manufacturer' THEN 'pending'
                    ELSE 'none'
                END,
                COALESCE(NEW.raw_user_meta_data->>'company_name', '')
            )
            ON CONFLICT (supabase_uid) DO UPDATE SET
                email = EXCLUDED.email,
                role = EXCLUDED.role,
                is_verified_buyer = EXCLUDED.is_verified_buyer,
                approval_status = EXCLUDED.approval_status,
                company_name = EXCLUDED.company_name;
        END IF;
        
    ELSE
        -- Domain not in whitelist - create/update user record as general_user or manufacturer
        IF existing_user_id IS NOT NULL THEN
            -- Update existing user
            UPDATE users SET
                supabase_uid = NEW.id,
                role = CASE 
                    WHEN requested_role = 'manufacturer' THEN 'manufacturer'
                    ELSE 'general_user'
                END,
                is_verified_buyer = FALSE,
                approval_status = CASE 
                    WHEN requested_role = 'manufacturer' THEN 'pending'
                    ELSE 'none'
                END,
                company_name = COALESCE(NEW.raw_user_meta_data->>'company_name', company_name)
            WHERE id = existing_user_id;
        ELSE
            -- Insert new user
            INSERT INTO users (
                email,
                supabase_uid,
                role,
                is_verified_buyer,
                approval_status,
                company_name
            ) VALUES (
                NEW.email,
                NEW.id,
                CASE 
                    WHEN requested_role = 'manufacturer' THEN 'manufacturer'
                    ELSE 'general_user'
                END,
                FALSE,
                CASE 
                    WHEN requested_role = 'manufacturer' THEN 'pending'
                    ELSE 'none'
                END,
                COALESCE(NEW.raw_user_meta_data->>'company_name', '')
            )
            ON CONFLICT (supabase_uid) DO UPDATE SET
                email = EXCLUDED.email,
                role = EXCLUDED.role,
                is_verified_buyer = EXCLUDED.is_verified_buyer,
                approval_status = EXCLUDED.approval_status,
                company_name = EXCLUDED.company_name;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger that fires on auth.users insert
DROP TRIGGER IF EXISTS trigger_auto_verify_buyer ON auth.users;

CREATE TRIGGER trigger_auto_verify_buyer
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auto_verify_buyer();

-- ============================================
-- PART 7: RLS FOR ALLOWED_COMPANIES TABLE
-- ============================================
-- Enable RLS on allowed_companies table
ALTER TABLE allowed_companies ENABLE ROW LEVEL SECURITY;

-- Allow public read access to allowed_companies (needed for trigger)
-- FIXED: Disable public read access to prevent data leakage
-- The trigger uses SECURITY DEFINER so it doesn't need this policy.
-- Only service role (backend) needs access.
-- CREATE POLICY "Allow public read access to allowed_companies"
--    ON allowed_companies FOR SELECT
--    USING (true);

-- Service role has full access
CREATE POLICY "Service role has full access to allowed_companies"
    ON allowed_companies FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next steps:
-- 1. Import allowed_companies.csv data into allowed_companies table
-- 2. Run the migration script (migrate_to_supabase.py) to migrate existing data
-- 3. Update your .env file with Supabase credentials
-- ============================================

