-- ============================================
-- SET ALL FABRICS TO PENDING_REVIEW STATUS
-- ============================================
-- This will set all fabrics in the database to PENDING_REVIEW
-- They will appear in the Staging Inbox in your admin dashboard

UPDATE fabric 
SET status = 'PENDING_REVIEW';

-- ============================================
-- VERIFY THE UPDATE
-- ============================================
-- Check status distribution after update
SELECT status, COUNT(*) as count 
FROM fabric 
GROUP BY status 
ORDER BY count DESC;

-- View a sample of updated fabrics
SELECT id, ref, fabric_group, status 
FROM fabric 
ORDER BY id
LIMIT 20;

