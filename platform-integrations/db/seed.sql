-- ============================================================================
-- Seed Data for Development
-- ============================================================================

-- Insert default organization
INSERT INTO organizations (name, domain, api_key, settings, is_active)
VALUES (
  'Default Organization',
  'localhost',
  'dev_api_key_12345',
  '{"theme": "default", "widget_color": "#4F46E5"}',
  true
);
