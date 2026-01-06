-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_number TEXT UNIQUE NOT NULL,
  floor TEXT NOT NULL CHECK (floor IN ('ground', 'first', 'cottage')),
  room_type TEXT NOT NULL CHECK (room_type IN ('standard', 'deluxe', 'cottage', 'dormitory', 'suit', 'deluxe cottage')),
  max_occupancy INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'cleaning', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guests table
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  proof_type TEXT NOT NULL CHECK (proof_type IN ('aadhar', 'pan', 'driving_license')),
  proof_number TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  check_out_date DATE,
  number_of_guests INTEGER NOT NULL,
  base_amount DECIMAL(10, 2) NOT NULL,
  gst_rate DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
  gst_amount DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method = 'cash'),
  status TEXT NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'checked_out', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room status log table
CREATE TABLE room_status_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('occupied', 'cleaning', 'available', 'maintenance')),
  cleaned_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_check_in_date ON bookings(check_in_date);
CREATE INDEX idx_room_status_log_room_id ON room_status_log(room_id);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_room_number ON rooms(room_number);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log room status changes
CREATE OR REPLACE FUNCTION log_room_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO room_status_log (room_id, booking_id, status, notes)
    VALUES (NEW.id, NULL, NEW.status, 'Status changed from ' || OLD.status || ' to ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for room status logging
CREATE TRIGGER log_room_status_trigger AFTER UPDATE OF status ON rooms
  FOR EACH ROW EXECUTE FUNCTION log_room_status_change();

-- Insert initial room data
-- Ground Floor (9 rooms, max 2 guests, standard)
INSERT INTO rooms (room_number, floor, room_type, max_occupancy, status) VALUES
('1', 'ground', 'standard', 2, 'available'),
('2', 'ground', 'standard', 2, 'available'),
('3', 'ground', 'standard', 2, 'available'),
('4', 'ground', 'standard', 2, 'available'),
('5', 'ground', 'standard', 2, 'available'),
('6', 'ground', 'standard', 2, 'available'),
('7', 'ground', 'standard', 2, 'available'),
('8', 'ground', 'standard', 2, 'available'),
('9', 'ground', 'standard', 2, 'available');

-- First Floor
INSERT INTO rooms (room_number, floor, room_type, max_occupancy, status) VALUES
('10', 'first', 'standard', 2, 'available'),
('11', 'first', 'standard', 2, 'available'),
('12', 'first', 'standard', 2, 'available'),
('13', 'first', 'dormitory', 2, 'maintenance'), -- Dormitory, not for guests
('14', 'first', 'deluxe', 2, 'available');

-- Additional rooms
INSERT INTO rooms (room_number, floor, room_type, max_occupancy, status) VALUES
('15A', 'cottage', 'cottage', 2, 'available'),
('15B', 'cottage', 'deluxe', 2, 'available'),
('16', 'cottage', 'deluxe', 2, 'available'),
('17', 'cottage', 'deluxe', 2, 'available'),
('18', 'cottage', 'cottage', 2, 'available'),
('19', 'cottage', 'deluxe', 2, 'available'),
('20', 'cottage', 'deluxe', 2, 'available'),
('21', 'cottage', 'deluxe', 2, 'available');

-- Insert default settings
INSERT INTO settings (key, value) VALUES
('gst_rate', '18.00');

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users to read/write all data
-- In production, you may want to restrict this based on user roles

-- Rooms policies
CREATE POLICY "Allow authenticated users to read rooms" ON rooms
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update rooms" ON rooms
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Guests policies
CREATE POLICY "Allow authenticated users to read guests" ON guests
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert guests" ON guests
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update guests" ON guests
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Bookings policies
CREATE POLICY "Allow authenticated users to read bookings" ON bookings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert bookings" ON bookings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update bookings" ON bookings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Room status log policies
CREATE POLICY "Allow authenticated users to read room_status_log" ON room_status_log
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert room_status_log" ON room_status_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update room_status_log" ON room_status_log
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Settings policies
CREATE POLICY "Allow authenticated users to read settings" ON settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update settings" ON settings
  FOR UPDATE USING (auth.role() = 'authenticated');

