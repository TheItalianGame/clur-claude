-- EHR Sample Data Initialization
-- This file populates the system with sample data for testing and demonstration

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- ============================================
-- Sample Employees
-- ============================================

INSERT OR REPLACE INTO employees (id, first_name, last_name, email, phone, role, department, hire_date, manager_id, is_active) VALUES
  ('emp-001', 'John', 'Smith', 'john.smith@clinic.com', '555-0101', 'Chief Medical Officer', 'Administration', '2015-01-15', NULL, 1),
  ('emp-002', 'Sarah', 'Johnson', 'sarah.johnson@clinic.com', '555-0102', 'Lead Physician', 'Internal Medicine', '2016-03-20', 'emp-001', 1),
  ('emp-003', 'Michael', 'Williams', 'michael.williams@clinic.com', '555-0103', 'Physician', 'Internal Medicine', '2018-06-10', 'emp-002', 1),
  ('emp-004', 'Emily', 'Brown', 'emily.brown@clinic.com', '555-0104', 'Nurse Practitioner', 'Family Medicine', '2017-09-05', 'emp-002', 1),
  ('emp-005', 'David', 'Davis', 'david.davis@clinic.com', '555-0105', 'Physician', 'Cardiology', '2019-02-12', 'emp-001', 1),
  ('emp-006', 'Lisa', 'Miller', 'lisa.miller@clinic.com', '555-0106', 'Registered Nurse', 'Emergency', '2020-04-18', 'emp-002', 1),
  ('emp-007', 'Robert', 'Wilson', 'robert.wilson@clinic.com', '555-0107', 'Medical Assistant', 'Internal Medicine', '2021-07-22', 'emp-003', 1),
  ('emp-008', 'Jennifer', 'Moore', 'jennifer.moore@clinic.com', '555-0108', 'Office Manager', 'Administration', '2016-11-30', 'emp-001', 1),
  ('emp-009', 'James', 'Taylor', 'james.taylor@clinic.com', '555-0109', 'Physician', 'Pediatrics', '2018-03-15', 'emp-001', 1),
  ('emp-010', 'Maria', 'Anderson', 'maria.anderson@clinic.com', '555-0110', 'Lab Technician', 'Laboratory', '2019-08-25', 'emp-008', 1);

-- ============================================
-- Sample Patients
-- ============================================

INSERT OR REPLACE INTO patients (id, first_name, last_name, date_of_birth, gender, email, phone, address, emergency_contact, medical_record_number, insurance_info, primary_provider_id) VALUES
  ('pat-001', 'Alice', 'Thompson', '1985-03-15', 'Female', 'alice.thompson@email.com', '555-1001', '123 Main St, Springfield, IL 62701', 'Bob Thompson (555-1002)', 'MRN001', 'Blue Cross Blue Shield - Policy: BC123456', 'emp-002'),
  ('pat-002', 'Charles', 'Martinez', '1972-08-22', 'Male', 'charles.martinez@email.com', '555-1003', '456 Oak Ave, Springfield, IL 62702', 'Sofia Martinez (555-1004)', 'MRN002', 'Aetna - Policy: AE789012', 'emp-003'),
  ('pat-003', 'Emma', 'Garcia', '1990-12-10', 'Female', 'emma.garcia@email.com', '555-1005', '789 Pine Rd, Springfield, IL 62703', 'Luis Garcia (555-1006)', 'MRN003', 'United Healthcare - Policy: UH345678', 'emp-003'),
  ('pat-004', 'William', 'Rodriguez', '1958-05-30', 'Male', 'william.rodriguez@email.com', '555-1007', '321 Elm St, Springfield, IL 62704', 'Maria Rodriguez (555-1008)', 'MRN004', 'Medicare - Policy: MC901234', 'emp-005'),
  ('pat-005', 'Olivia', 'Lewis', '2010-09-18', 'Female', 'olivia.lewis@email.com', '555-1009', '654 Maple Dr, Springfield, IL 62705', 'James Lewis (555-1010)', 'MRN005', 'Cigna - Policy: CG567890', 'emp-009'),
  ('pat-006', 'Noah', 'Lee', '1995-04-25', 'Male', 'noah.lee@email.com', '555-1011', '987 Cedar Ln, Springfield, IL 62706', 'Grace Lee (555-1012)', 'MRN006', 'Humana - Policy: HU234567', 'emp-002'),
  ('pat-007', 'Sophia', 'Walker', '1980-11-12', 'Female', 'sophia.walker@email.com', '555-1013', '147 Birch Way, Springfield, IL 62707', 'Michael Walker (555-1014)', 'MRN007', 'Kaiser - Policy: KP890123', 'emp-003'),
  ('pat-008', 'Liam', 'Hall', '2005-07-08', 'Male', 'liam.hall@email.com', '555-1015', '258 Spruce Ct, Springfield, IL 62708', 'Emma Hall (555-1016)', 'MRN008', 'Blue Cross Blue Shield - Policy: BC456789', 'emp-009'),
  ('pat-009', 'Isabella', 'Allen', '1968-02-14', 'Female', 'isabella.allen@email.com', '555-1017', '369 Willow St, Springfield, IL 62709', 'Robert Allen (555-1018)', 'MRN009', 'Aetna - Policy: AE012345', 'emp-005'),
  ('pat-010', 'Mason', 'Young', '1988-06-20', 'Male', 'mason.young@email.com', '555-1019', '741 Ash Ave, Springfield, IL 62710', 'Ashley Young (555-1020)', 'MRN010', 'United Healthcare - Policy: UH678901', 'emp-002');

-- ============================================
-- Sample Visits
-- ============================================

INSERT OR REPLACE INTO visits (id, patient_id, provider_id, visit_date, visit_type, reason, notes, status, duration_minutes) VALUES
  ('vis-001', 'pat-001', 'emp-002', '2025-08-20 09:00:00', 'Consultation', 'Annual checkup', 'Patient in good health, routine labs ordered', 'completed', 30),
  ('vis-002', 'pat-002', 'emp-003', '2025-08-20 10:30:00', 'Follow-up', 'Hypertension follow-up', 'Blood pressure controlled with medication', 'completed', 20),
  ('vis-003', 'pat-003', 'emp-003', '2025-08-21 14:00:00', 'Routine Check', 'Prenatal visit', 'Normal pregnancy progression at 20 weeks', 'completed', 45),
  ('vis-004', 'pat-004', 'emp-005', '2025-08-21 15:30:00', 'Consultation', 'Chest pain evaluation', 'EKG normal, stress test scheduled', 'completed', 60),
  ('vis-005', 'pat-005', 'emp-009', '2025-08-22 09:30:00', 'Routine Check', 'Well child visit', 'Growth and development on track', 'completed', 30),
  ('vis-006', 'pat-006', 'emp-002', '2025-08-25 10:00:00', 'Follow-up', 'Diabetes management', 'Adjusting insulin regimen', 'scheduled', 30),
  ('vis-007', 'pat-007', 'emp-003', '2025-08-25 11:00:00', 'Consultation', 'Migraine evaluation', NULL, 'scheduled', 45),
  ('vis-008', 'pat-008', 'emp-009', '2025-08-26 09:00:00', 'Emergency', 'Sports injury', NULL, 'scheduled', 30),
  ('vis-009', 'pat-009', 'emp-005', '2025-08-26 14:00:00', 'Follow-up', 'Post-operative check', NULL, 'scheduled', 20),
  ('vis-010', 'pat-010', 'emp-002', '2025-08-27 10:30:00', 'Consultation', 'Anxiety assessment', NULL, 'scheduled', 60);

-- ============================================
-- Sample Meetings
-- ============================================

INSERT OR REPLACE INTO meetings (id, title, description, start_time, end_time, location, organizer_id, attendees, meeting_type, status) VALUES
  ('meet-001', 'Department Heads Meeting', 'Monthly review of department operations', '2025-08-25 08:00:00', '2025-08-25 09:00:00', 'Conference Room A', 'emp-001', '["emp-002","emp-008","emp-009"]', 'Staff', 'scheduled'),
  ('meet-002', 'Medical Staff Meeting', 'Review of new clinical protocols', '2025-08-26 12:00:00', '2025-08-26 13:00:00', 'Main Auditorium', 'emp-002', '["emp-003","emp-004","emp-005","emp-009"]', 'Staff', 'scheduled'),
  ('meet-003', 'Patient Care Conference', 'Complex case review for patient care planning', '2025-08-27 15:00:00', '2025-08-27 16:00:00', 'Conference Room B', 'emp-003', '["emp-002","emp-004","emp-006"]', 'Patient', 'scheduled'),
  ('meet-004', 'Training: EMR System Update', 'Training on new EMR features', '2025-08-28 10:00:00', '2025-08-28 11:30:00', 'Training Room', 'emp-008', '["emp-006","emp-007","emp-010"]', 'Training', 'scheduled'),
  ('meet-005', 'Quality Improvement Review', 'Quarterly QI metrics review', '2025-08-29 14:00:00', '2025-08-29 15:30:00', 'Conference Room A', 'emp-001', '["emp-002","emp-003","emp-008"]', 'Staff', 'scheduled');

-- ============================================
-- Sample Dynamic Records - Appointments
-- ============================================

INSERT OR REPLACE INTO dt_appointment (id, data) VALUES
  ('appt-001', '{"patient_id":"pat-001","provider_id":"emp-002","appointment_date":"2025-08-28T09:00:00","appointment_type":"Follow-up","duration_minutes":30,"status":"scheduled","reason":"Blood pressure check","location":"Exam Room 1"}'),
  ('appt-002', '{"patient_id":"pat-003","provider_id":"emp-003","appointment_date":"2025-08-28T14:00:00","appointment_type":"Procedure","duration_minutes":45,"status":"scheduled","reason":"Ultrasound","location":"Imaging Suite"}'),
  ('appt-003', '{"patient_id":"pat-005","provider_id":"emp-009","appointment_date":"2025-08-29T10:00:00","appointment_type":"Consultation","duration_minutes":30,"status":"scheduled","reason":"Vaccination","location":"Pediatric Wing"}');

-- ============================================
-- Sample Dynamic Records - Diagnoses
-- ============================================

INSERT OR REPLACE INTO dt_diagnosis (id, data) VALUES
  ('diag-001', '{"patient_id":"pat-002","provider_id":"emp-003","diagnosis_date":"2025-08-20","icd10_code":"I10","diagnosis_name":"Essential hypertension","severity":"Moderate","status":"Active","notes":"Managed with medication"}'),
  ('diag-002', '{"patient_id":"pat-004","provider_id":"emp-005","diagnosis_date":"2025-08-21","icd10_code":"I25.10","diagnosis_name":"Atherosclerotic heart disease","severity":"Mild","status":"Active","notes":"Monitoring with regular follow-ups"}'),
  ('diag-003', '{"patient_id":"pat-006","provider_id":"emp-002","diagnosis_date":"2025-08-15","icd10_code":"E11.9","diagnosis_name":"Type 2 diabetes mellitus","severity":"Moderate","status":"Active","notes":"Insulin dependent"}');

-- ============================================
-- Sample Dynamic Records - Prescriptions
-- ============================================

INSERT OR REPLACE INTO dt_prescription (id, data) VALUES
  ('rx-001', '{"patient_id":"pat-002","provider_id":"emp-003","medication_name":"Lisinopril","dosage":"10mg","frequency":"Once daily","route":"Oral","start_date":"2025-08-20","end_date":"2026-08-20","refills":11,"status":"Active","pharmacy":"Springfield Pharmacy","notes":"For hypertension management"}'),
  ('rx-002', '{"patient_id":"pat-006","provider_id":"emp-002","medication_name":"Metformin","dosage":"500mg","frequency":"Twice daily","route":"Oral","start_date":"2025-08-15","end_date":"2026-08-15","refills":11,"status":"Active","pharmacy":"City Center Pharmacy","notes":"Take with meals"}'),
  ('rx-003', '{"patient_id":"pat-004","provider_id":"emp-005","medication_name":"Atorvastatin","dosage":"20mg","frequency":"Once daily at bedtime","route":"Oral","start_date":"2025-08-21","end_date":"2026-08-21","refills":11,"status":"Active","pharmacy":"Main Street Pharmacy","notes":"For cholesterol management"}');

-- ============================================
-- Sample Dynamic Records - Lab Results
-- ============================================

INSERT OR REPLACE INTO dt_lab_result (id, data) VALUES
  ('lab-001', '{"patient_id":"pat-001","provider_id":"emp-002","test_date":"2025-08-20","test_name":"Complete Blood Count","result_value":"Normal ranges","unit":"","reference_range":"See report","status":"Final","lab_facility":"Springfield Medical Lab","notes":"All values within normal limits"}'),
  ('lab-002', '{"patient_id":"pat-002","provider_id":"emp-003","test_date":"2025-08-20","test_name":"Hemoglobin A1C","result_value":"6.8","unit":"%","reference_range":"<5.7%","status":"Final","lab_facility":"Springfield Medical Lab","abnormal_flag":"High","notes":"Slightly elevated, monitor"}'),
  ('lab-003', '{"patient_id":"pat-004","provider_id":"emp-005","test_date":"2025-08-21","test_name":"Lipid Panel","result_value":"Total Cholesterol: 210","unit":"mg/dL","reference_range":"<200 mg/dL","status":"Final","lab_facility":"Central Lab Services","abnormal_flag":"High","notes":"Borderline high cholesterol"}');

-- ============================================
-- Sample Dynamic Records - Vital Signs
-- ============================================

INSERT OR REPLACE INTO dt_vital_signs (id, data) VALUES
  ('vital-001', '{"patient_id":"pat-001","provider_id":"emp-002","measurement_date":"2025-08-20T09:00:00","blood_pressure_systolic":120,"blood_pressure_diastolic":80,"heart_rate":72,"temperature":98.6,"respiratory_rate":16,"oxygen_saturation":98,"weight":150,"height":65,"bmi":25.0,"notes":"Normal vital signs"}'),
  ('vital-002', '{"patient_id":"pat-002","provider_id":"emp-003","measurement_date":"2025-08-20T10:30:00","blood_pressure_systolic":135,"blood_pressure_diastolic":88,"heart_rate":78,"temperature":98.4,"respiratory_rate":18,"oxygen_saturation":97,"weight":180,"height":70,"bmi":25.8,"notes":"Slightly elevated BP"}'),
  ('vital-003', '{"patient_id":"pat-003","provider_id":"emp-003","measurement_date":"2025-08-21T14:00:00","blood_pressure_systolic":118,"blood_pressure_diastolic":75,"heart_rate":82,"temperature":98.7,"respiratory_rate":16,"oxygen_saturation":99,"weight":145,"height":64,"bmi":24.9,"notes":"Pregnancy vital signs normal"}');

-- ============================================
-- Sample Dynamic Records - Bills
-- ============================================

INSERT OR REPLACE INTO dt_bill (id, data) VALUES
  ('bill-001', '{"patient_id":"pat-001","visit_id":"vis-001","bill_date":"2025-08-20","total_amount":250.00,"insurance_covered":200.00,"patient_responsibility":50.00,"status":"Pending","due_date":"2025-09-20","service_description":"Annual checkup with labs","billing_code":"99213"}'),
  ('bill-002', '{"patient_id":"pat-004","visit_id":"vis-004","bill_date":"2025-08-21","total_amount":450.00,"insurance_covered":360.00,"patient_responsibility":90.00,"status":"Pending","due_date":"2025-09-21","service_description":"Cardiology consultation with EKG","billing_code":"99244"}'),
  ('bill-003', '{"patient_id":"pat-005","visit_id":"vis-005","bill_date":"2025-08-22","total_amount":150.00,"insurance_covered":120.00,"patient_responsibility":30.00,"status":"Paid","due_date":"2025-09-22","service_description":"Pediatric well child visit","billing_code":"99392","payment_date":"2025-08-23"}');

-- ============================================
-- Sample Dynamic Records - Tasks
-- ============================================

INSERT OR REPLACE INTO dt_task (id, data) VALUES
  ('task-001', '{"title":"Review lab results for pat-001","description":"Review and sign off on CBC results","assigned_to":"emp-002","priority":"Medium","status":"Pending","due_date":"2025-08-25","task_type":"Clinical","created_date":"2025-08-20","related_patient":"pat-001"}'),
  ('task-002', '{"title":"Schedule follow-up for pat-004","description":"Schedule stress test following cardiology consultation","assigned_to":"emp-007","priority":"High","status":"In Progress","due_date":"2025-08-26","task_type":"Administrative","created_date":"2025-08-21","related_patient":"pat-004"}'),
  ('task-003', '{"title":"Insurance pre-authorization","description":"Obtain pre-auth for pat-003 ultrasound","assigned_to":"emp-008","priority":"High","status":"Pending","due_date":"2025-08-27","task_type":"Administrative","created_date":"2025-08-22","related_patient":"pat-003"}');

-- ============================================
-- Sample Dynamic Records - Clinical Notes
-- ============================================

INSERT OR REPLACE INTO dt_note (id, data) VALUES
  ('note-001', '{"patient_id":"pat-001","provider_id":"emp-002","visit_id":"vis-001","note_date":"2025-08-20","note_type":"Progress Note","chief_complaint":"Annual checkup","history_present_illness":"Patient presents for routine annual examination. No acute complaints.","assessment":"Healthy adult, no acute issues","plan":"Continue current health maintenance. Follow up in 1 year.","signed_by":"emp-002","signed_date":"2025-08-20T09:30:00"}'),
  ('note-002', '{"patient_id":"pat-002","provider_id":"emp-003","visit_id":"vis-002","note_date":"2025-08-20","note_type":"Follow-up Note","chief_complaint":"Hypertension follow-up","history_present_illness":"Patient returns for 3-month follow-up of hypertension. Compliance with medication good.","assessment":"Hypertension, improved control","plan":"Continue current medication. Recheck in 3 months.","signed_by":"emp-003","signed_date":"2025-08-20T10:50:00"}'),
  ('note-003', '{"patient_id":"pat-004","provider_id":"emp-005","visit_id":"vis-004","note_date":"2025-08-21","note_type":"Consultation Note","chief_complaint":"Chest pain evaluation","history_present_illness":"65-year-old male with intermittent chest pain x 2 weeks. Pain is substernal, occurs with exertion.","assessment":"Possible stable angina","plan":"Order stress test, start aspirin, consider cardiac catheterization if positive","signed_by":"emp-005","signed_date":"2025-08-21T16:30:00"}');

-- ============================================
-- Sample Dynamic Records - Insurance Claims
-- ============================================

INSERT OR REPLACE INTO dt_insurance_claim (id, data) VALUES
  ('claim-001', '{"patient_id":"pat-001","bill_id":"bill-001","claim_number":"CLM2025082001","insurance_company":"Blue Cross Blue Shield","policy_number":"BC123456","date_submitted":"2025-08-21","amount_claimed":200.00,"status":"Submitted","service_date":"2025-08-20","diagnosis_codes":"Z00.00","procedure_codes":"99213"}'),
  ('claim-002', '{"patient_id":"pat-004","bill_id":"bill-002","claim_number":"CLM2025082101","insurance_company":"Medicare","policy_number":"MC901234","date_submitted":"2025-08-22","amount_claimed":360.00,"status":"Submitted","service_date":"2025-08-21","diagnosis_codes":"R07.9","procedure_codes":"99244,93000"}'),
  ('claim-003', '{"patient_id":"pat-005","bill_id":"bill-003","claim_number":"CLM2025082201","insurance_company":"Cigna","policy_number":"CG567890","date_submitted":"2025-08-23","amount_claimed":120.00,"status":"Approved","service_date":"2025-08-22","diagnosis_codes":"Z00.129","procedure_codes":"99392","approved_amount":120.00,"approval_date":"2025-08-23"}');

-- ============================================
-- Sample Dynamic Records - Schedule Blocks
-- ============================================

INSERT OR REPLACE INTO dt_schedule_block (id, data) VALUES
  ('block-001', '{"provider_id":"emp-002","block_date":"2025-08-30","start_time":"12:00:00","end_time":"13:00:00","block_type":"Lunch","reason":"Lunch break","recurring":"Daily","status":"Active"}'),
  ('block-002', '{"provider_id":"emp-003","block_date":"2025-09-05","start_time":"08:00:00","end_time":"17:00:00","block_type":"Time Off","reason":"Personal day","recurring":"No","status":"Approved"}'),
  ('block-003', '{"provider_id":"emp-005","block_date":"2025-08-28","start_time":"14:00:00","end_time":"16:00:00","block_type":"Meeting","reason":"Medical conference call","recurring":"No","status":"Active"}');

-- ============================================
-- Sample Record Relationships
-- ============================================

INSERT OR REPLACE INTO record_relationships (id, source_record_id, source_record_type, target_record_id, target_record_type, relationship_type, metadata) VALUES
  ('rel-001', 'vis-001', 'visit', 'lab-001', 'rt-lab-result', 'has_lab_result', '{"ordered_during_visit":true}'),
  ('rel-002', 'vis-001', 'visit', 'note-001', 'rt-note', 'has_note', '{"note_type":"progress"}'),
  ('rel-003', 'vis-002', 'visit', 'rx-001', 'rt-prescription', 'has_prescription', '{"new_prescription":false}'),
  ('rel-004', 'vis-004', 'visit', 'diag-002', 'rt-diagnosis', 'has_diagnosis', '{"new_diagnosis":true}'),
  ('rel-005', 'pat-001', 'patient', 'task-001', 'rt-task', 'has_task', '{"task_priority":"medium"}'),
  ('rel-006', 'bill-001', 'rt-bill', 'claim-001', 'rt-insurance-claim', 'has_claim', '{"claim_status":"submitted"}'),
  ('rel-007', 'pat-002', 'patient', 'diag-001', 'rt-diagnosis', 'has_diagnosis', '{"chronic_condition":true}'),
  ('rel-008', 'pat-006', 'patient', 'rx-002', 'rt-prescription', 'has_prescription', '{"medication_type":"maintenance"}'),
  ('rel-009', 'vis-003', 'visit', 'appt-002', 'rt-appointment', 'scheduled_from', '{"follow_up":true}'),
  ('rel-010', 'emp-002', 'employee', 'block-001', 'rt-schedule-block', 'has_schedule_block', '{"recurring":true}');

-- ============================================
-- Sample Custom Records (for testing custom types)
-- ============================================

INSERT OR REPLACE INTO cdt_test_study (id, data) VALUES
  ('study-001', '{"study_name":"Clinical Trial ABC","patient_id":"pat-007","enrollment_date":"2025-08-15","study_phase":"Phase 2","principal_investigator":"emp-002","status":"Active"}'),
  ('study-002', '{"study_name":"Research Protocol XYZ","patient_id":"pat-010","enrollment_date":"2025-08-18","study_phase":"Phase 3","principal_investigator":"emp-003","status":"Screening"}');