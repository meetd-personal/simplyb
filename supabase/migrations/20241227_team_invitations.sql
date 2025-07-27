-- Create team_invitations table for improved invitation system
CREATE TABLE IF NOT EXISTS team_invitations (
  id TEXT PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  inviter_name TEXT NOT NULL,
  invitee_email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'EMPLOYEE', 'ACCOUNTANT')),
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_invitations_business_id ON team_invitations(business_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);

-- Create RLS policies
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Business owners and managers can view invitations for their business
CREATE POLICY "Business members can view invitations" ON team_invitations
  FOR SELECT
  USING (
    business_id IN (
      SELECT business_id
      FROM business_members
      WHERE user_id = auth.uid()
      AND role IN ('OWNER', 'MANAGER')
      AND is_active = true
    )
  );

-- Policy: Business owners and managers can create invitations
CREATE POLICY "Business owners and managers can create invitations" ON team_invitations
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id
      FROM business_members
      WHERE user_id = auth.uid()
      AND role IN ('OWNER', 'MANAGER')
      AND is_active = true
    )
  );

-- Policy: Business owners and managers can update invitations
CREATE POLICY "Business owners and managers can update invitations" ON team_invitations
  FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id
      FROM business_members
      WHERE user_id = auth.uid()
      AND role IN ('OWNER', 'MANAGER')
      AND is_active = true
    )
  );

-- Policy: Anyone can view invitation by token (for acceptance)
CREATE POLICY "Anyone can view invitation by token" ON team_invitations
  FOR SELECT
  USING (true);

-- Policy: Anyone can update invitation status when accepting
CREATE POLICY "Anyone can accept invitation" ON team_invitations
  FOR UPDATE
  USING (status = 'pending');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_team_invitations_updated_at();

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE team_invitations 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' 
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to expire old invitations (run daily)
-- Note: This requires the pg_cron extension to be enabled
-- SELECT cron.schedule('expire-invitations', '0 0 * * *', 'SELECT expire_old_invitations();');

-- Insert some sample data for testing (optional)
-- INSERT INTO team_invitations (
--   id, business_id, business_name, inviter_name, invitee_email, role, token, expires_at
-- ) VALUES (
--   'inv_sample_001',
--   (SELECT id FROM businesses LIMIT 1),
--   'Sample Restaurant',
--   'John Owner',
--   'manager@example.com',
--   'MANAGER',
--   'sample_token_123',
--   NOW() + INTERVAL '7 days'
-- );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON team_invitations TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
