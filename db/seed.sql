-- Seed data for the application
-- This is sample data - customize it for your project needs

-- Insert sample users
INSERT INTO users (id, email, name) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'john.doe@example.com', 'John Doe'),
  ('550e8400-e29b-41d4-a716-446655440002', 'jane.smith@example.com', 'Jane Smith'),
  ('550e8400-e29b-41d4-a716-446655440003', 'bob.wilson@example.com', 'Bob Wilson')
ON CONFLICT (email) DO NOTHING;

-- Insert sample items
INSERT INTO items (user_id, title, description, status) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'First Item', 'This is the first sample item', 'active'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Second Item', 'This is the second sample item', 'active'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Third Item', 'This is the third sample item', 'active'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Fourth Item', 'This is the fourth sample item', 'completed'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Fifth Item', 'This is the fifth sample item', 'active'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Sixth Item', 'This is the sixth sample item', 'completed')
ON CONFLICT DO NOTHING;
