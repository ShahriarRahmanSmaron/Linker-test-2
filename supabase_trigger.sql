-- PostgreSQL Trigger for Auto-Verification of Buyers
-- This trigger automatically sets is_verified_buyer=True when a user signs up
-- if their email domain matches an entry in the allowed_companies table

-- ============================================
-- FUNCTION: Auto-verify buyer on signup
-- ============================================
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

-- ============================================
-- TRIGGER: Fire on auth.users insert
-- ============================================
DROP TRIGGER IF EXISTS trigger_auto_verify_buyer ON auth.users;

CREATE TRIGGER trigger_auto_verify_buyer
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auto_verify_buyer();

-- ============================================
-- FIX: Enable RLS on allowed_companies table
-- ============================================
ALTER TABLE allowed_companies ENABLE ROW LEVEL SECURITY;

-- Allow public read access to allowed_companies (needed for trigger)
CREATE POLICY "Allow public read access to allowed_companies"
    ON allowed_companies FOR SELECT
    USING (true);

-- Service role has full access
CREATE POLICY "Service role has full access to allowed_companies"
    ON allowed_companies FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- NOTES:
-- ============================================
-- 1. This trigger fires automatically when a new user signs up via Supabase Auth
-- 2. It checks the email domain against allowed_companies table
-- 3. If match found and role is 'buyer', sets is_verified_buyer=True
-- 4. If role is 'manufacturer', always sets approval_status='pending' (requires admin approval)
-- 5. The trigger uses SECURITY DEFINER to allow inserting into users table
-- 6. User metadata (requested_role, company_name) should be set during signup in frontend

