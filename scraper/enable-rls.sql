-- Enable Row Level Security (RLS) for all tables in the schema
-- This script enables RLS on all tables. After enabling RLS, you'll need to create
-- policies to define access rules for each table.
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_index_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_index_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_type_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_alt_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;