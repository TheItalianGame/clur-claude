-- Add record categories table
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

-- Add category_id and additional flags to record_types
ALTER TABLE record_types ADD COLUMN category_id TEXT REFERENCES record_categories(id);
ALTER TABLE record_types ADD COLUMN description TEXT;
ALTER TABLE record_types ADD COLUMN show_in_calendar BOOLEAN DEFAULT 1;
ALTER TABLE record_types ADD COLUMN show_in_sidebar BOOLEAN DEFAULT 1;
ALTER TABLE record_types ADD COLUMN allow_create BOOLEAN DEFAULT 1;
ALTER TABLE record_types ADD COLUMN allow_edit BOOLEAN DEFAULT 1;
ALTER TABLE record_types ADD COLUMN allow_delete BOOLEAN DEFAULT 1;
ALTER TABLE record_types ADD COLUMN requires_patient BOOLEAN DEFAULT 0;
ALTER TABLE record_types ADD COLUMN requires_visit BOOLEAN DEFAULT 0;
ALTER TABLE record_types ADD COLUMN order_index INTEGER DEFAULT 0;

-- Record relationships table for linking records
CREATE TABLE IF NOT EXISTS record_relationships (
  id TEXT PRIMARY KEY,
  source_record_id TEXT NOT NULL,
  source_record_type TEXT NOT NULL,
  target_record_id TEXT NOT NULL,
  target_record_type TEXT NOT NULL,
  relationship_type TEXT NOT NULL, -- parent, child, related, attachment
  metadata TEXT, -- JSON for additional relationship data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_record_type) REFERENCES record_types(id),
  FOREIGN KEY (target_record_type) REFERENCES record_types(id)
);

-- Insert default categories
INSERT OR IGNORE INTO record_categories (id, name, display_name, description, icon, color, order_index, is_system) VALUES
  ('cat-clinical', 'clinical', 'Clinical', 'Patient care and medical records', 'Stethoscope', '#10B981', 1, 1),
  ('cat-scheduling', 'scheduling', 'Scheduling', 'Appointments and calendar events', 'Calendar', '#3B82F6', 2, 1),
  ('cat-administrative', 'administrative', 'Administrative', 'Office and staff management', 'Briefcase', '#8B5CF6', 3, 1),
  ('cat-financial', 'financial', 'Financial', 'Billing and payments', 'DollarSign', '#F59E0B', 4, 1),
  ('cat-documents', 'documents', 'Documents', 'Forms and paperwork', 'FileText', '#6B7280', 5, 1),
  ('cat-pharmacy', 'pharmacy', 'Pharmacy', 'Medications and prescriptions', 'Pill', '#EC4899', 6, 1);

-- Update existing record types with categories
UPDATE record_types SET category_id = 'cat-clinical', order_index = 1 WHERE name = 'patient';
UPDATE record_types SET category_id = 'cat-clinical', order_index = 2, show_in_calendar = 1 WHERE name = 'visit';
UPDATE record_types SET category_id = 'cat-scheduling', order_index = 1, show_in_calendar = 1 WHERE name = 'meeting';
UPDATE record_types SET category_id = 'cat-administrative', order_index = 1 WHERE name = 'employee';

-- Insert additional default record types
INSERT OR IGNORE INTO record_types (id, name, display_name, category_id, color, icon, description, show_in_calendar, show_in_sidebar, requires_patient, requires_visit, order_index, is_system) VALUES
  -- Clinical Records
  ('rt-diagnosis', 'diagnosis', 'Diagnosis', 'cat-clinical', '#DC2626', 'Activity', 'Patient diagnoses and conditions', 0, 1, 1, 1, 3, 1),
  ('rt-treatment-plan', 'treatment_plan', 'Treatment Plan', 'cat-clinical', '#059669', 'ClipboardList', 'Patient treatment plans', 0, 1, 1, 0, 4, 1),
  ('rt-lab-result', 'lab_result', 'Lab Result', 'cat-clinical', '#7C3AED', 'TestTube', 'Laboratory test results', 0, 1, 1, 0, 5, 1),
  ('rt-vital-signs', 'vital_signs', 'Vital Signs', 'cat-clinical', '#0891B2', 'Heart', 'Patient vital sign measurements', 0, 1, 1, 1, 6, 1),
  
  -- Pharmacy Records
  ('rt-prescription', 'prescription', 'Prescription', 'cat-pharmacy', '#EC4899', 'Pill', 'Medication prescriptions', 0, 1, 1, 1, 1, 1),
  ('rt-medication', 'medication', 'Medication', 'cat-pharmacy', '#F472B6', 'Package', 'Medication inventory', 0, 1, 0, 0, 2, 1),
  
  -- Financial Records
  ('rt-bill', 'bill', 'Bill', 'cat-financial', '#F59E0B', 'Receipt', 'Patient bills and invoices', 0, 1, 1, 1, 1, 1),
  ('rt-payment', 'payment', 'Payment', 'cat-financial', '#84CC16', 'CreditCard', 'Payment records', 0, 1, 1, 0, 2, 1),
  ('rt-insurance-claim', 'insurance_claim', 'Insurance Claim', 'cat-financial', '#F97316', 'Shield', 'Insurance claims', 0, 1, 1, 1, 3, 1),
  
  -- Scheduling Records
  ('rt-appointment', 'appointment', 'Appointment', 'cat-scheduling', '#3B82F6', 'Clock', 'Patient appointments', 1, 1, 1, 0, 2, 1),
  ('rt-schedule-block', 'schedule_block', 'Schedule Block', 'cat-scheduling', '#6366F1', 'Lock', 'Provider schedule blocks', 1, 1, 0, 0, 3, 1),
  
  -- Document Records
  ('rt-consent', 'consent', 'Consent Form', 'cat-documents', '#6B7280', 'CheckSquare', 'Patient consent forms', 0, 1, 1, 0, 1, 1),
  ('rt-referral', 'referral', 'Referral', 'cat-documents', '#9CA3AF', 'Send', 'Patient referrals', 0, 1, 1, 0, 2, 1),
  ('rt-note', 'note', 'Clinical Note', 'cat-documents', '#4B5563', 'Edit', 'Clinical notes and documentation', 0, 1, 1, 1, 3, 1),
  
  -- Administrative Records
  ('rt-task', 'task', 'Task', 'cat-administrative', '#8B5CF6', 'CheckCircle', 'Staff tasks and to-dos', 0, 1, 0, 0, 2, 1),
  ('rt-incident', 'incident', 'Incident Report', 'cat-administrative', '#EF4444', 'AlertTriangle', 'Incident reports', 0, 1, 0, 0, 3, 1),
  ('rt-equipment', 'equipment', 'Equipment', 'cat-administrative', '#A78BFA', 'Tool', 'Medical equipment inventory', 0, 1, 0, 0, 4, 1);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_record_types_category ON record_types(category_id);
CREATE INDEX IF NOT EXISTS idx_record_relationships_source ON record_relationships(source_record_id, source_record_type);
CREATE INDEX IF NOT EXISTS idx_record_relationships_target ON record_relationships(target_record_id, target_record_type);