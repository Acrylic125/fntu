-- Enable Row Level Security (RLS) for all tables in the schema
-- This script enables RLS on all tables. After enabling RLS, you'll need to create
-- policies to define access rules for each table.

-- Enable RLS for programs table
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- Enable RLS for courses table
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Enable RLS for course_index table
ALTER TABLE course_index ENABLE ROW LEVEL SECURITY;

-- Enable RLS for course_index_sources table
ALTER TABLE course_index_sources ENABLE ROW LEVEL SECURITY;

-- Enable RLS for course_index_classes table
ALTER TABLE course_index_classes ENABLE ROW LEVEL SECURITY;

-- Enable RLS for venues table
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- Enable RLS for locations table
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Enable RLS for location_geometry table
ALTER TABLE location_geometry ENABLE ROW LEVEL SECURITY;

