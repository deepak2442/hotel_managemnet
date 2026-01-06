-- Allow authenticated users to delete rooms
CREATE POLICY "Allow authenticated users to delete rooms" ON rooms
  FOR DELETE
  USING (auth.role() = 'authenticated');

