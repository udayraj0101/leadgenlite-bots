-- Add email and password_hash columns to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Update default organization with admin credentials (will be hashed by setup script)
UPDATE organizations SET email = 'admin@leadgenlite.com' WHERE id = (SELECT id FROM organizations LIMIT 1);
