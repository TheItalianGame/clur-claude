-- Core tables for dynamic record system

-- Record types definition
CREATE TABLE IF NOT EXISTS record_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT,
  is_system BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Field definitions for each record type
CREATE TABLE IF NOT EXISTS field_definitions (
  id TEXT PRIMARY KEY,
  record_type_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  field_type TEXT NOT NULL, -- text, number, date, datetime, select, multiselect, boolean, relation
  is_required BOOLEAN DEFAULT 0,
  default_value TEXT,
  options TEXT, -- JSON for select/multiselect options
  validation_rules TEXT, -- JSON for validation rules
  order_index INTEGER DEFAULT 0,
  show_in_employee_calendar BOOLEAN DEFAULT 0, -- Whether this field makes record relevant to employee
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (record_type_id) REFERENCES record_types(id) ON DELETE CASCADE
);

-- Form definitions for displaying records
CREATE TABLE IF NOT EXISTS form_definitions (
  id TEXT PRIMARY KEY,
  record_type_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT 0,
  layout TEXT NOT NULL, -- JSON defining form layout
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (record_type_id) REFERENCES record_types(id) ON DELETE CASCADE
);

-- Calendar display settings for record types
CREATE TABLE IF NOT EXISTS calendar_settings (
  id TEXT PRIMARY KEY,
  record_type_id TEXT NOT NULL UNIQUE,
  date_field TEXT NOT NULL, -- which field to use for calendar placement
  title_field TEXT NOT NULL, -- which field to display as title
  show_on_calendar BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (record_type_id) REFERENCES record_types(id) ON DELETE CASCADE
);

-- System tables for default record types

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT,
  department TEXT,
  hire_date DATE,
  manager_id TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES employees(id)
);

-- Patients
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  emergency_contact TEXT,
  medical_record_number TEXT UNIQUE,
  insurance_info TEXT,
  primary_provider_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (primary_provider_id) REFERENCES employees(id)
);

-- Visits
CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  visit_date DATETIME NOT NULL,
  visit_type TEXT NOT NULL,
  reason TEXT,
  notes TEXT,
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled, no-show
  duration_minutes INTEGER DEFAULT 30,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (provider_id) REFERENCES employees(id)
);

-- Meetings
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  location TEXT,
  organizer_id TEXT NOT NULL,
  attendees TEXT, -- JSON array of employee IDs
  meeting_type TEXT, -- staff, patient, external
  status TEXT DEFAULT 'scheduled',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES employees(id)
);

-- Dynamic records storage
CREATE TABLE IF NOT EXISTS dynamic_records (
  id TEXT PRIMARY KEY,
  record_type_id TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON data
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (record_type_id) REFERENCES record_types(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_meetings_time ON meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_dynamic_records_type ON dynamic_records(record_type_id);
CREATE INDEX IF NOT EXISTS idx_field_definitions_type ON field_definitions(record_type_id);