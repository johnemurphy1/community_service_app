-- Run this script once to initialize your database
-- On Render.com: use the PostgreSQL shell or connect via psql

CREATE TABLE IF NOT EXISTS service_records (
  id          SERIAL PRIMARY KEY,
  student_name     VARCHAR(150) NOT NULL,
  supervisor_name  VARCHAR(150) NOT NULL,
  activity_description TEXT NOT NULL,
  hours        NUMERIC(5, 2) NOT NULL CHECK (hours > 0),
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast search by student name (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_student_name ON service_records (LOWER(student_name));

-- Trigger to auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON service_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
