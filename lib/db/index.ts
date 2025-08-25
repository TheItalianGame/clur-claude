import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';

const db = new Database('ehr.db');
db.pragma('journal_mode = WAL');

export function initializeDatabase() {
  const schema = readFileSync(path.join(process.cwd(), 'lib/db/schema.sql'), 'utf-8');
  db.exec(schema);
  
  seedDefaultData();
  
  // Apply schema updates
  import('./apply-updates');
}

function seedDefaultData() {
  const checkRecordTypes = db.prepare('SELECT COUNT(*) as count FROM record_types').get() as { count: number };
  
  if (checkRecordTypes.count === 0) {
    const insertRecordType = db.prepare(`
      INSERT INTO record_types (id, name, display_name, color, icon, is_system)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const insertFieldDef = db.prepare(`
      INSERT INTO field_definitions (id, record_type_id, field_name, display_name, field_type, is_required, order_index, show_in_employee_calendar, options)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertCalendarSettings = db.prepare(`
      INSERT INTO calendar_settings (id, record_type_id, date_field, title_field)
      VALUES (?, ?, ?, ?)
    `);
    
    const insertFormDef = db.prepare(`
      INSERT INTO form_definitions (id, record_type_id, name, is_default, layout)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    // Employee record type
    insertRecordType.run('employee', 'employee', 'Employee', '#10B981', 'user', 1);
    insertFieldDef.run('emp-1', 'employee', 'first_name', 'First Name', 'text', 1, 1, 0, null);
    insertFieldDef.run('emp-2', 'employee', 'last_name', 'Last Name', 'text', 1, 2, 0, null);
    insertFieldDef.run('emp-3', 'employee', 'email', 'Email', 'text', 1, 3, 0, null);
    insertFieldDef.run('emp-4', 'employee', 'phone', 'Phone', 'text', 0, 4, 0, null);
    insertFieldDef.run('emp-5', 'employee', 'role', 'Role', 'text', 0, 5, 0, null);
    insertFieldDef.run('emp-6', 'employee', 'department', 'Department', 'text', 0, 6, 0, null);
    insertFieldDef.run('emp-7', 'employee', 'hire_date', 'Hire Date', 'date', 0, 7, 0, null);
    insertFieldDef.run('emp-8', 'employee', 'manager_id', 'Manager', 'relation', 0, 8, 1, JSON.stringify({ record_type: 'employee' }));
    insertCalendarSettings.run('cal-emp', 'employee', 'hire_date', 'first_name');
    
    // Patient record type
    insertRecordType.run('patient', 'patient', 'Patient', '#3B82F6', 'user-check', 1);
    insertFieldDef.run('pat-1', 'patient', 'first_name', 'First Name', 'text', 1, 1, 0, null);
    insertFieldDef.run('pat-2', 'patient', 'last_name', 'Last Name', 'text', 1, 2, 0, null);
    insertFieldDef.run('pat-3', 'patient', 'date_of_birth', 'Date of Birth', 'date', 1, 3, 0, null);
    insertFieldDef.run('pat-4', 'patient', 'gender', 'Gender', 'select', 0, 4, 0, JSON.stringify(['Male', 'Female', 'Other']));
    insertFieldDef.run('pat-5', 'patient', 'email', 'Email', 'text', 0, 5, 0, null);
    insertFieldDef.run('pat-6', 'patient', 'phone', 'Phone', 'text', 0, 6, 0, null);
    insertFieldDef.run('pat-7', 'patient', 'medical_record_number', 'MRN', 'text', 0, 7, 0, null);
    insertFieldDef.run('pat-8', 'patient', 'primary_provider_id', 'Primary Provider', 'relation', 0, 8, 1, JSON.stringify({ record_type: 'employee' }));
    insertCalendarSettings.run('cal-pat', 'patient', 'created_at', 'first_name');
    
    // Visit record type
    insertRecordType.run('visit', 'visit', 'Visit', '#EF4444', 'calendar', 1);
    insertFieldDef.run('vis-1', 'visit', 'patient_id', 'Patient', 'relation', 1, 1, 0, JSON.stringify({ record_type: 'patient' }));
    insertFieldDef.run('vis-2', 'visit', 'provider_id', 'Provider', 'relation', 1, 2, 1, JSON.stringify({ record_type: 'employee' }));
    insertFieldDef.run('vis-3', 'visit', 'visit_date', 'Visit Date', 'datetime', 1, 3, 0, null);
    insertFieldDef.run('vis-4', 'visit', 'visit_type', 'Visit Type', 'select', 1, 4, 0, JSON.stringify(['Consultation', 'Follow-up', 'Emergency', 'Routine Check']));
    insertFieldDef.run('vis-5', 'visit', 'reason', 'Reason', 'text', 0, 5, 0, null);
    insertFieldDef.run('vis-6', 'visit', 'status', 'Status', 'select', 0, 6, 0, JSON.stringify(['scheduled', 'completed', 'cancelled', 'no-show']));
    insertFieldDef.run('vis-7', 'visit', 'duration_minutes', 'Duration (min)', 'number', 0, 7, 0, null);
    insertCalendarSettings.run('cal-vis', 'visit', 'visit_date', 'visit_type');
    
    // Meeting record type
    insertRecordType.run('meeting', 'meeting', 'Meeting', '#F59E0B', 'users', 1);
    insertFieldDef.run('meet-1', 'meeting', 'title', 'Title', 'text', 1, 1, 0, null);
    insertFieldDef.run('meet-2', 'meeting', 'description', 'Description', 'textarea', 0, 2, 0, null);
    insertFieldDef.run('meet-3', 'meeting', 'start_time', 'Start Time', 'datetime', 1, 3, 0, null);
    insertFieldDef.run('meet-4', 'meeting', 'end_time', 'End Time', 'datetime', 1, 4, 0, null);
    insertFieldDef.run('meet-5', 'meeting', 'location', 'Location', 'text', 0, 5, 0, null);
    insertFieldDef.run('meet-6', 'meeting', 'organizer_id', 'Organizer', 'relation', 1, 6, 1, JSON.stringify({ record_type: 'employee' }));
    insertFieldDef.run('meet-7', 'meeting', 'meeting_type', 'Type', 'select', 0, 7, 0, JSON.stringify(['Staff', 'Patient', 'External', 'Training']));
    insertFieldDef.run('meet-8', 'meeting', 'attendees', 'Attendees', 'multiselect', 0, 8, 1, JSON.stringify({ record_type: 'employee' }));
    insertCalendarSettings.run('cal-meet', 'meeting', 'start_time', 'title');
    
    // Create default forms for each record type
    const recordTypes = ['employee', 'patient', 'visit', 'meeting'];
    recordTypes.forEach(type => {
      const defaultLayout = {
        sections: [
          {
            title: 'General Information',
            columns: 2,
            fields: 'all'
          }
        ]
      };
      insertFormDef.run(`form-${type}`, type, 'Default Form', 1, JSON.stringify(defaultLayout));
    });
    
    // Insert sample data
    const insertEmployee = db.prepare(`
      INSERT INTO employees (id, first_name, last_name, email, phone, role, department, hire_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertEmployee.run('emp-001', 'John', 'Doe', 'john.doe@clinic.com', '555-0101', 'Doctor', 'Cardiology', '2023-01-15');
    insertEmployee.run('emp-002', 'Jane', 'Smith', 'jane.smith@clinic.com', '555-0102', 'Nurse', 'Emergency', '2023-03-20');
    insertEmployee.run('emp-003', 'Bob', 'Johnson', 'bob.johnson@clinic.com', '555-0103', 'Administrator', 'Admin', '2022-11-10');
    
    const insertPatient = db.prepare(`
      INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, email, phone, medical_record_number, primary_provider_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertPatient.run('pat-001', 'Alice', 'Williams', '1985-06-15', 'Female', 'alice@email.com', '555-1001', 'MRN001', 'emp-001');
    insertPatient.run('pat-002', 'Charlie', 'Brown', '1972-09-22', 'Male', 'charlie@email.com', '555-1002', 'MRN002', 'emp-001');
    insertPatient.run('pat-003', 'Diana', 'Davis', '1990-03-08', 'Female', 'diana@email.com', '555-1003', 'MRN003', 'emp-002');
    
    const insertVisit = db.prepare(`
      INSERT INTO visits (id, patient_id, provider_id, visit_date, visit_type, reason, status, duration_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    insertVisit.run('vis-001', 'pat-001', 'emp-001', today.toISOString(), 'Consultation', 'Regular checkup', 'scheduled', 30);
    insertVisit.run('vis-002', 'pat-002', 'emp-001', tomorrow.toISOString(), 'Follow-up', 'Post-surgery follow-up', 'scheduled', 45);
    
    const insertMeeting = db.prepare(`
      INSERT INTO meetings (id, title, description, start_time, end_time, location, organizer_id, meeting_type, attendees)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const meetingStart = new Date(today);
    meetingStart.setHours(14, 0, 0, 0);
    const meetingEnd = new Date(today);
    meetingEnd.setHours(15, 0, 0, 0);
    
    insertMeeting.run('meet-001', 'Staff Meeting', 'Weekly staff sync', meetingStart.toISOString(), meetingEnd.toISOString(), 'Conference Room A', 'emp-003', 'Staff', JSON.stringify(['emp-001', 'emp-002', 'emp-003']));
  }
}

export default db;