-- EHR System Tables and Schema Initialization
-- This file creates all system tables, fields, and relationships

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- ============================================
-- Core System Tables
-- ============================================

-- Record Categories (for organizing record types)
CREATE TABLE IF NOT EXISTS record_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#6B7280',
  order_index INTEGER DEFAULT 0,
  is_system BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Record Types Definition (source of truth for schema)
CREATE TABLE IF NOT EXISTS record_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT,
  is_system BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  category_id TEXT REFERENCES record_categories(id),
  description TEXT,
  show_in_calendar BOOLEAN DEFAULT 1,
  show_in_sidebar BOOLEAN DEFAULT 1,
  allow_create BOOLEAN DEFAULT 1,
  allow_edit BOOLEAN DEFAULT 1,
  allow_delete BOOLEAN DEFAULT 1,
  requires_patient BOOLEAN DEFAULT 0,
  requires_visit BOOLEAN DEFAULT 0,
  order_index INTEGER DEFAULT 0
);

-- Field Definitions for Each Record Type
CREATE TABLE IF NOT EXISTS field_definitions (
  id TEXT PRIMARY KEY,
  record_type_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  field_type TEXT NOT NULL, -- text, number, date, datetime, select, multiselect, boolean, relation, textarea
  is_required BOOLEAN DEFAULT 0,
  default_value TEXT,
  options TEXT, -- JSON for select/multiselect options
  validation_rules TEXT, -- JSON for validation rules
  order_index INTEGER DEFAULT 0,
  show_in_employee_calendar BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_system INTEGER DEFAULT 0,
  FOREIGN KEY (record_type_id) REFERENCES record_types(id) ON DELETE CASCADE
);

-- Form Definitions for Displaying Records
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

-- Calendar Display Settings for Record Types
CREATE TABLE IF NOT EXISTS calendar_settings (
  id TEXT PRIMARY KEY,
  record_type_id TEXT NOT NULL UNIQUE,
  date_field TEXT NOT NULL,
  title_field TEXT NOT NULL,
  show_on_calendar BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (record_type_id) REFERENCES record_types(id) ON DELETE CASCADE
);

-- Record Relationships
CREATE TABLE IF NOT EXISTS record_relationships (
  id TEXT PRIMARY KEY,
  source_record_id TEXT NOT NULL,
  source_record_type TEXT NOT NULL,
  target_record_id TEXT NOT NULL,
  target_record_type TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_record_type) REFERENCES record_types(id),
  FOREIGN KEY (target_record_type) REFERENCES record_types(id)
);

-- Schema Migrations Tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_type_id TEXT NOT NULL,
  change_type TEXT NOT NULL,
  details TEXT NOT NULL,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dynamic Records Storage
CREATE TABLE IF NOT EXISTS dynamic_records (
  id TEXT PRIMARY KEY,
  record_type_id TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON data
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (record_type_id) REFERENCES record_types(id) ON DELETE CASCADE
);

-- ============================================
-- System Tables for Core Record Types
-- ============================================

-- Employees Table
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

-- Patients Table
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

-- Visits Table
CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  visit_date DATETIME NOT NULL,
  visit_type TEXT NOT NULL,
  reason TEXT,
  notes TEXT,
  status TEXT DEFAULT 'scheduled',
  duration_minutes INTEGER DEFAULT 30,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (provider_id) REFERENCES employees(id)
);

-- Meetings Table
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  location TEXT,
  organizer_id TEXT NOT NULL,
  attendees TEXT, -- JSON array of employee IDs
  meeting_type TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES employees(id)
);

-- ============================================
-- Dynamic Tables for Additional Record Types
-- ============================================

-- Appointments
CREATE TABLE IF NOT EXISTS dt_appointment (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bills
CREATE TABLE IF NOT EXISTS dt_bill (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Consent Forms
CREATE TABLE IF NOT EXISTS dt_consent (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Diagnoses
CREATE TABLE IF NOT EXISTS dt_diagnosis (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Equipment
CREATE TABLE IF NOT EXISTS dt_equipment (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Incident Reports
CREATE TABLE IF NOT EXISTS dt_incident (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insurance Claims
CREATE TABLE IF NOT EXISTS dt_insurance_claim (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Lab Results
CREATE TABLE IF NOT EXISTS dt_lab_result (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Medications
CREATE TABLE IF NOT EXISTS dt_medication (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Clinical Notes
CREATE TABLE IF NOT EXISTS dt_note (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE IF NOT EXISTS dt_payment (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions
CREATE TABLE IF NOT EXISTS dt_prescription (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Referrals
CREATE TABLE IF NOT EXISTS dt_referral (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Schedule Blocks
CREATE TABLE IF NOT EXISTS dt_schedule_block (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tasks
CREATE TABLE IF NOT EXISTS dt_task (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Treatment Plans
CREATE TABLE IF NOT EXISTS dt_treatment_plan (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vital Signs
CREATE TABLE IF NOT EXISTS dt_vital_signs (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Custom Dynamic Tables (non-system)
CREATE TABLE IF NOT EXISTS cdt_test_study (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cdt_bmad (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cdt_bresslermad (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_record_types_category ON record_types(category_id);
CREATE INDEX IF NOT EXISTS idx_field_definitions_type ON field_definitions(record_type_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_meetings_time ON meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_dynamic_records_type ON dynamic_records(record_type_id);
CREATE INDEX IF NOT EXISTS idx_record_relationships_source ON record_relationships(source_record_id, source_record_type);
CREATE INDEX IF NOT EXISTS idx_record_relationships_target ON record_relationships(target_record_id, target_record_type);

-- ============================================
-- Initialize System Categories
-- ============================================

INSERT OR REPLACE INTO record_categories (id, name, display_name, description, icon, color, order_index, is_system) VALUES
  ('cat-clinical', 'clinical', 'Clinical', 'Patient care and medical records', 'Stethoscope', '#10B981', 1, 1),
  ('cat-scheduling', 'scheduling', 'Scheduling', 'Appointments and calendar events', 'Calendar', '#3B82F6', 2, 1),
  ('cat-administrative', 'administrative', 'Administrative', 'Office and staff management', 'Briefcase', '#8B5CF6', 3, 1),
  ('cat-financial', 'financial', 'Financial', 'Billing and payments', 'DollarSign', '#F59E0B', 4, 1),
  ('cat-documents', 'documents', 'Documents', 'Forms and paperwork', 'FileText', '#6B7280', 5, 1),
  ('cat-pharmacy', 'pharmacy', 'Pharmacy', 'Medications and prescriptions', 'Pill', '#EC4899', 6, 1),
  ('cat-custom', 'custom', 'Custom', '', 'Package', '#9333EA', 1000, 0),
  ('cat-research', 'research', 'Research', '', 'FlaskConical', '#10B981', 500, 0);

-- ============================================
-- Initialize System Record Types
-- ============================================

INSERT OR REPLACE INTO record_types (id, name, display_name, color, icon, is_system, category_id, description, show_in_calendar, show_in_sidebar, allow_create, allow_edit, allow_delete, requires_patient, requires_visit, order_index) VALUES
  ('employee', 'employee', 'Employee', '#10B981', 'user', 1, 'cat-administrative', NULL, 1, 1, 1, 1, 1, 0, 0, 1),
  ('patient', 'patient', 'Patient', '#3B82F6', 'user-check', 1, 'cat-clinical', NULL, 1, 1, 1, 1, 1, 0, 0, 1),
  ('visit', 'visit', 'Visit', '#EF4444', 'calendar', 1, 'cat-clinical', NULL, 1, 1, 1, 1, 1, 0, 0, 2),
  ('meeting', 'meeting', 'Meeting', '#F59E0B', 'users', 1, 'cat-scheduling', NULL, 1, 1, 1, 1, 1, 0, 0, 1),
  ('rt-diagnosis', 'diagnosis', 'Diagnosis', '#DC2626', 'Activity', 1, 'cat-clinical', 'Patient diagnoses and conditions', 0, 1, 1, 1, 1, 1, 1, 3),
  ('rt-prescription', 'prescription', 'Prescription', '#EC4899', 'Pill', 1, 'cat-pharmacy', 'Medication prescriptions', 0, 1, 1, 1, 1, 1, 1, 1),
  ('rt-bill', 'bill', 'Bill', '#F59E0B', 'DollarSign', 1, 'cat-financial', 'Billing statements', 0, 1, 1, 1, 1, 0, 0, 1),
  ('rt-consent', 'consent', 'Consent Form', '#6B7280', 'FileSignature', 1, 'cat-documents', 'Patient consent forms', 0, 1, 1, 1, 1, 1, 0, 1),
  ('rt-medication', 'medication', 'Medication', '#EC4899', 'Pill', 1, 'cat-pharmacy', 'Medication records', 0, 1, 1, 1, 1, 1, 0, 2),
  ('rt-payment', 'payment', 'Payment', '#F59E0B', 'CreditCard', 1, 'cat-financial', 'Payment records', 0, 1, 1, 1, 1, 0, 0, 2),
  ('rt-appointment', 'appointment', 'Appointment', '#3B82F6', 'Calendar', 1, 'cat-scheduling', 'Patient appointments', 1, 1, 1, 1, 1, 1, 0, 2),
  ('rt-referral', 'referral', 'Referral', '#6B7280', 'Send', 1, 'cat-documents', 'Patient referrals', 0, 1, 1, 1, 1, 1, 0, 2),
  ('rt-task', 'task', 'Task', '#8B5CF6', 'CheckSquare', 1, 'cat-administrative', 'Administrative tasks', 1, 1, 1, 1, 1, 0, 0, 2),
  ('rt-insurance-claim', 'insurance_claim', 'Insurance Claim', '#F59E0B', 'Shield', 1, 'cat-financial', 'Insurance claims', 0, 1, 1, 1, 1, 1, 0, 3),
  ('rt-schedule-block', 'schedule_block', 'Schedule Block', '#3B82F6', 'Lock', 1, 'cat-scheduling', 'Schedule blocking', 1, 1, 1, 1, 1, 0, 0, 3),
  ('rt-note', 'note', 'Clinical Note', '#6B7280', 'FileText', 1, 'cat-documents', 'Clinical notes and documentation', 0, 1, 1, 1, 1, 1, 1, 3),
  ('rt-incident', 'incident', 'Incident Report', '#8B5CF6', 'AlertTriangle', 1, 'cat-administrative', 'Incident reports', 0, 1, 1, 1, 1, 0, 0, 3),
  ('rt-treatment-plan', 'treatment_plan', 'Treatment Plan', '#10B981', 'ClipboardList', 1, 'cat-clinical', 'Patient treatment plans', 0, 1, 1, 1, 1, 1, 0, 4),
  ('rt-equipment', 'equipment', 'Equipment', '#8B5CF6', 'Tool', 1, 'cat-administrative', 'Medical equipment', 0, 1, 1, 1, 1, 0, 0, 4),
  ('rt-lab-result', 'lab_result', 'Lab Result', '#10B981', 'Flask', 1, 'cat-clinical', 'Laboratory test results', 0, 1, 1, 1, 1, 1, 0, 5),
  ('rt-vital-signs', 'vital_signs', 'Vital Signs', '#10B981', 'Activity', 1, 'cat-clinical', 'Patient vital signs', 0, 1, 1, 1, 1, 1, 1, 6),
  ('test_study', 'test_study', 'Test Study', '#10B981', NULL, 0, 'cat-research', NULL, 0, 1, 1, 1, 1, 1, 1, 0),
  ('bmad', 'bmad', 'bermad', '#9333EA', NULL, 0, 'cat-custom', NULL, 0, 1, 1, 1, 1, 1, 1, 0);

-- ============================================
-- Initialize Field Definitions
-- ============================================

-- Employee Fields
INSERT OR REPLACE INTO field_definitions (id, record_type_id, field_name, display_name, field_type, is_required, default_value, options, validation_rules, order_index, show_in_employee_calendar, is_system) VALUES
  ('emp-1', 'employee', 'first_name', 'First Name', 'text', 1, NULL, NULL, NULL, 1, 0, 1),
  ('emp-2', 'employee', 'last_name', 'Last Name', 'text', 1, NULL, NULL, NULL, 2, 0, 1),
  ('emp-3', 'employee', 'email', 'Email', 'text', 1, NULL, NULL, NULL, 3, 0, 1),
  ('emp-4', 'employee', 'phone', 'Phone', 'text', 0, NULL, NULL, NULL, 4, 0, 1),
  ('emp-5', 'employee', 'role', 'Role', 'text', 0, NULL, NULL, NULL, 5, 0, 1),
  ('emp-6', 'employee', 'department', 'Department', 'text', 0, NULL, NULL, NULL, 6, 0, 1),
  ('emp-7', 'employee', 'hire_date', 'Hire Date', 'date', 0, NULL, NULL, NULL, 7, 0, 1),
  ('emp-8', 'employee', 'manager_id', 'Manager', 'relation', 0, NULL, '{"record_type":"employee"}', NULL, 8, 1, 1);

-- Patient Fields
INSERT OR REPLACE INTO field_definitions (id, record_type_id, field_name, display_name, field_type, is_required, default_value, options, validation_rules, order_index, show_in_employee_calendar, is_system) VALUES
  ('pat-1', 'patient', 'first_name', 'First Name', 'text', 1, NULL, NULL, NULL, 1, 0, 1),
  ('pat-2', 'patient', 'last_name', 'Last Name', 'text', 1, NULL, NULL, NULL, 2, 0, 1),
  ('pat-3', 'patient', 'date_of_birth', 'Date of Birth', 'date', 1, NULL, NULL, NULL, 3, 0, 1),
  ('pat-4', 'patient', 'gender', 'Gender', 'select', 0, NULL, '["Male","Female","Other"]', NULL, 4, 0, 1),
  ('pat-5', 'patient', 'email', 'Email', 'text', 0, NULL, NULL, NULL, 5, 0, 1),
  ('pat-6', 'patient', 'phone', 'Phone', 'text', 0, NULL, NULL, NULL, 6, 0, 1),
  ('pat-7', 'patient', 'medical_record_number', 'MRN', 'text', 0, NULL, NULL, NULL, 7, 0, 1),
  ('pat-8', 'patient', 'primary_provider_id', 'Primary Provider', 'relation', 0, NULL, '{"record_type":"employee"}', NULL, 8, 1, 1);

-- Visit Fields
INSERT OR REPLACE INTO field_definitions (id, record_type_id, field_name, display_name, field_type, is_required, default_value, options, validation_rules, order_index, show_in_employee_calendar, is_system) VALUES
  ('vis-1', 'visit', 'patient_id', 'Patient', 'relation', 1, NULL, '{"record_type":"patient"}', NULL, 1, 0, 1),
  ('vis-2', 'visit', 'provider_id', 'Provider', 'relation', 1, NULL, '{"record_type":"employee"}', NULL, 2, 1, 1),
  ('vis-3', 'visit', 'visit_date', 'Visit Date', 'datetime', 1, NULL, NULL, NULL, 3, 0, 1),
  ('vis-4', 'visit', 'visit_type', 'Visit Type', 'select', 1, NULL, '["Consultation","Follow-up","Emergency","Routine Check"]', NULL, 4, 0, 1),
  ('vis-5', 'visit', 'reason', 'Reason', 'text', 0, NULL, NULL, NULL, 5, 0, 1),
  ('vis-6', 'visit', 'status', 'Status', 'select', 0, NULL, '["scheduled","completed","cancelled","no-show"]', NULL, 6, 0, 1),
  ('vis-7', 'visit', 'duration_minutes', 'Duration (min)', 'number', 0, NULL, NULL, NULL, 7, 0, 1);

-- Meeting Fields
INSERT OR REPLACE INTO field_definitions (id, record_type_id, field_name, display_name, field_type, is_required, default_value, options, validation_rules, order_index, show_in_employee_calendar, is_system) VALUES
  ('meet-1', 'meeting', 'title', 'Title', 'text', 1, NULL, NULL, NULL, 1, 0, 1),
  ('meet-2', 'meeting', 'description', 'Description', 'textarea', 0, NULL, NULL, NULL, 2, 0, 1),
  ('meet-3', 'meeting', 'start_time', 'Start Time', 'datetime', 1, NULL, NULL, NULL, 3, 0, 1),
  ('meet-4', 'meeting', 'end_time', 'End Time', 'datetime', 1, NULL, NULL, NULL, 4, 0, 1),
  ('meet-5', 'meeting', 'location', 'Location', 'text', 0, NULL, NULL, NULL, 5, 0, 1),
  ('meet-6', 'meeting', 'organizer_id', 'Organizer', 'relation', 1, NULL, '{"record_type":"employee"}', NULL, 6, 1, 1),
  ('meet-7', 'meeting', 'meeting_type', 'Type', 'select', 0, NULL, '["Staff","Patient","External","Training"]', NULL, 7, 0, 1),
  ('meet-8', 'meeting', 'attendees', 'Attendees', 'multiselect', 0, NULL, '{"record_type":"employee"}', NULL, 8, 1, 1);

-- Additional field definitions would be inserted here for all other record types
-- Due to length, I'm including a sample for appointments

INSERT OR REPLACE INTO field_definitions (id, record_type_id, field_name, display_name, field_type, is_required, default_value, options, order_index, show_in_employee_calendar, is_system) VALUES
  ('appt-1', 'rt-appointment', 'patient_id', 'Patient', 'relation', 1, NULL, '{"record_type":"patient"}', 1, 0, 1),
  ('appt-2', 'rt-appointment', 'provider_id', 'Provider', 'relation', 1, NULL, '{"record_type":"employee"}', 2, 1, 1),
  ('appt-3', 'rt-appointment', 'appointment_date', 'Appointment Date', 'datetime', 1, NULL, NULL, 3, 0, 1),
  ('appt-4', 'rt-appointment', 'appointment_type', 'Type', 'select', 1, NULL, '["Consultation","Follow-up","Procedure","Emergency"]', 4, 0, 1),
  ('appt-5', 'rt-appointment', 'duration_minutes', 'Duration (min)', 'number', 0, '30', NULL, 5, 0, 1),
  ('appt-6', 'rt-appointment', 'status', 'Status', 'select', 1, 'scheduled', '["scheduled","confirmed","arrived","in-progress","completed","cancelled","no-show"]', 6, 0, 1),
  ('appt-7', 'rt-appointment', 'reason', 'Reason', 'textarea', 0, NULL, NULL, 7, 0, 1),
  ('appt-8', 'rt-appointment', 'notes', 'Notes', 'textarea', 0, NULL, NULL, 8, 0, 1),
  ('appt-9', 'rt-appointment', 'reminder_sent', 'Reminder Sent', 'boolean', 0, '0', NULL, 9, 0, 1),
  ('appt-10', 'rt-appointment', 'location', 'Location', 'text', 0, NULL, NULL, 10, 0, 1);