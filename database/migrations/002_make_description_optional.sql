-- Migration: Make description field optional in transactions table
-- This allows transactions to be created without a description since category is the main identifier

-- Make description field nullable
ALTER TABLE transactions ALTER COLUMN description DROP NOT NULL;

-- Update existing transactions with empty descriptions to use category as description
UPDATE transactions 
SET description = category 
WHERE description = '' OR description IS NULL;

-- Add a comment to document the change
COMMENT ON COLUMN transactions.description IS 'Optional description field - category is the main identifier';
