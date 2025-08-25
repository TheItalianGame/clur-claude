import db from './index';
import { nanoid } from 'nanoid';

export function seedNewRecordTypes() {
  console.log('Creating field definitions for new record types...');
  
  const recordTypes = [
    {
      id: 'rt-diagnosis',
      fields: [
        { name: 'patient_id', display: 'Patient', type: 'relation', required: true, options: { record_type: 'patient' } },
        { name: 'visit_id', display: 'Visit', type: 'relation', required: false, options: { record_type: 'visit' } },
        { name: 'diagnosis_code', display: 'ICD Code', type: 'text', required: true },
        { name: 'diagnosis_name', display: 'Diagnosis', type: 'text', required: true },
        { name: 'diagnosis_date', display: 'Date', type: 'date', required: true },
        { name: 'severity', display: 'Severity', type: 'select', required: false, options: ['Mild', 'Moderate', 'Severe', 'Critical'] },
        { name: 'status', display: 'Status', type: 'select', required: true, options: ['Active', 'Resolved', 'Chronic', 'In Remission'] },
        { name: 'notes', display: 'Notes', type: 'textarea', required: false }
      ]
    },
    {
      id: 'rt-treatment-plan',
      fields: [
        { name: 'patient_id', display: 'Patient', type: 'relation', required: true, options: { record_type: 'patient' } },
        { name: 'diagnosis_id', display: 'Diagnosis', type: 'relation', required: false, options: { record_type: 'rt-diagnosis' } },
        { name: 'plan_name', display: 'Plan Name', type: 'text', required: true },
        { name: 'start_date', display: 'Start Date', type: 'date', required: true },
        { name: 'end_date', display: 'End Date', type: 'date', required: false },
        { name: 'goals', display: 'Treatment Goals', type: 'textarea', required: true },
        { name: 'interventions', display: 'Interventions', type: 'textarea', required: true },
        { name: 'status', display: 'Status', type: 'select', required: true, options: ['Planned', 'Active', 'On Hold', 'Completed', 'Discontinued'] }
      ]
    },
    {
      id: 'rt-lab-result',
      fields: [
        { name: 'patient_id', display: 'Patient', type: 'relation', required: true, options: { record_type: 'patient' } },
        { name: 'visit_id', display: 'Visit', type: 'relation', required: false, options: { record_type: 'visit' } },
        { name: 'test_name', display: 'Test Name', type: 'text', required: true },
        { name: 'test_date', display: 'Test Date', type: 'datetime', required: true },
        { name: 'result_value', display: 'Result', type: 'text', required: true },
        { name: 'unit', display: 'Unit', type: 'text', required: false },
        { name: 'normal_range', display: 'Normal Range', type: 'text', required: false },
        { name: 'status', display: 'Status', type: 'select', required: true, options: ['Normal', 'Abnormal', 'Critical', 'Pending'] },
        { name: 'notes', display: 'Notes', type: 'textarea', required: false }
      ]
    },
    {
      id: 'rt-vital-signs',
      fields: [
        { name: 'patient_id', display: 'Patient', type: 'relation', required: true, options: { record_type: 'patient' } },
        { name: 'visit_id', display: 'Visit', type: 'relation', required: true, options: { record_type: 'visit' } },
        { name: 'measurement_time', display: 'Time', type: 'datetime', required: true },
        { name: 'blood_pressure_systolic', display: 'BP Systolic', type: 'number', required: false },
        { name: 'blood_pressure_diastolic', display: 'BP Diastolic', type: 'number', required: false },
        { name: 'heart_rate', display: 'Heart Rate', type: 'number', required: false },
        { name: 'temperature', display: 'Temperature (°F)', type: 'number', required: false },
        { name: 'respiratory_rate', display: 'Respiratory Rate', type: 'number', required: false },
        { name: 'oxygen_saturation', display: 'O2 Saturation (%)', type: 'number', required: false },
        { name: 'weight', display: 'Weight (lbs)', type: 'number', required: false },
        { name: 'height', display: 'Height (in)', type: 'number', required: false }
      ]
    },
    {
      id: 'rt-prescription',
      fields: [
        { name: 'patient_id', display: 'Patient', type: 'relation', required: true, options: { record_type: 'patient' } },
        { name: 'visit_id', display: 'Visit', type: 'relation', required: true, options: { record_type: 'visit' } },
        { name: 'provider_id', display: 'Provider', type: 'relation', required: true, options: { record_type: 'employee' } },
        { name: 'medication_name', display: 'Medication', type: 'text', required: true },
        { name: 'dosage', display: 'Dosage', type: 'text', required: true },
        { name: 'frequency', display: 'Frequency', type: 'text', required: true },
        { name: 'route', display: 'Route', type: 'select', required: true, options: ['Oral', 'IV', 'IM', 'Topical', 'Inhaled', 'Sublingual'] },
        { name: 'quantity', display: 'Quantity', type: 'number', required: true },
        { name: 'refills', display: 'Refills', type: 'number', required: true },
        { name: 'start_date', display: 'Start Date', type: 'date', required: true },
        { name: 'end_date', display: 'End Date', type: 'date', required: false },
        { name: 'instructions', display: 'Instructions', type: 'textarea', required: false }
      ]
    },
    {
      id: 'rt-medication',
      fields: [
        { name: 'medication_name', display: 'Medication Name', type: 'text', required: true },
        { name: 'generic_name', display: 'Generic Name', type: 'text', required: false },
        { name: 'brand_name', display: 'Brand Name', type: 'text', required: false },
        { name: 'drug_class', display: 'Drug Class', type: 'text', required: false },
        { name: 'strength', display: 'Strength', type: 'text', required: true },
        { name: 'form', display: 'Form', type: 'select', required: true, options: ['Tablet', 'Capsule', 'Liquid', 'Injection', 'Cream', 'Patch', 'Inhaler'] },
        { name: 'stock_quantity', display: 'Stock Quantity', type: 'number', required: false },
        { name: 'reorder_level', display: 'Reorder Level', type: 'number', required: false },
        { name: 'contraindications', display: 'Contraindications', type: 'textarea', required: false }
      ]
    },
    {
      id: 'rt-bill',
      fields: [
        { name: 'patient_id', display: 'Patient', type: 'relation', required: true, options: { record_type: 'patient' } },
        { name: 'visit_id', display: 'Visit', type: 'relation', required: true, options: { record_type: 'visit' } },
        { name: 'bill_date', display: 'Bill Date', type: 'date', required: true },
        { name: 'due_date', display: 'Due Date', type: 'date', required: true },
        { name: 'total_amount', display: 'Total Amount', type: 'number', required: true },
        { name: 'paid_amount', display: 'Paid Amount', type: 'number', required: false },
        { name: 'insurance_coverage', display: 'Insurance Coverage', type: 'number', required: false },
        { name: 'status', display: 'Status', type: 'select', required: true, options: ['Pending', 'Partially Paid', 'Paid', 'Overdue', 'Sent to Collections'] },
        { name: 'description', display: 'Description', type: 'textarea', required: false }
      ]
    },
    {
      id: 'rt-payment',
      fields: [
        { name: 'patient_id', display: 'Patient', type: 'relation', required: true, options: { record_type: 'patient' } },
        { name: 'bill_id', display: 'Bill', type: 'relation', required: false, options: { record_type: 'rt-bill' } },
        { name: 'payment_date', display: 'Payment Date', type: 'datetime', required: true },
        { name: 'amount', display: 'Amount', type: 'number', required: true },
        { name: 'payment_method', display: 'Payment Method', type: 'select', required: true, options: ['Cash', 'Credit Card', 'Debit Card', 'Check', 'Insurance', 'Online'] },
        { name: 'reference_number', display: 'Reference Number', type: 'text', required: false },
        { name: 'notes', display: 'Notes', type: 'textarea', required: false }
      ]
    },
    {
      id: 'rt-insurance-claim',
      fields: [
        { name: 'patient_id', display: 'Patient', type: 'relation', required: true, options: { record_type: 'patient' } },
        { name: 'visit_id', display: 'Visit', type: 'relation', required: true, options: { record_type: 'visit' } },
        { name: 'claim_number', display: 'Claim Number', type: 'text', required: true },
        { name: 'submission_date', display: 'Submission Date', type: 'date', required: true },
        { name: 'insurance_provider', display: 'Insurance Provider', type: 'text', required: true },
        { name: 'claim_amount', display: 'Claim Amount', type: 'number', required: true },
        { name: 'approved_amount', display: 'Approved Amount', type: 'number', required: false },
        { name: 'status', display: 'Status', type: 'select', required: true, options: ['Submitted', 'Under Review', 'Approved', 'Denied', 'Appealed', 'Paid'] },
        { name: 'denial_reason', display: 'Denial Reason', type: 'textarea', required: false }
      ]
    },
    {
      id: 'rt-appointment',
      fields: [
        { name: 'patient_id', display: 'Patient', type: 'relation', required: true, options: { record_type: 'patient' } },
        { name: 'provider_id', display: 'Provider', type: 'relation', required: true, options: { record_type: 'employee' } },
        { name: 'appointment_date', display: 'Date', type: 'date', required: true },
        { name: 'appointment_time', display: 'Time', type: 'datetime', required: true },
        { name: 'duration_minutes', display: 'Duration (min)', type: 'number', required: true },
        { name: 'appointment_type', display: 'Type', type: 'select', required: true, options: ['Consultation', 'Follow-up', 'Procedure', 'Lab Work', 'Imaging'] },
        { name: 'reason', display: 'Reason', type: 'text', required: false },
        { name: 'status', display: 'Status', type: 'select', required: true, options: ['Scheduled', 'Confirmed', 'Checked In', 'In Progress', 'Completed', 'Cancelled', 'No Show'] },
        { name: 'notes', display: 'Notes', type: 'textarea', required: false }
      ]
    },
    {
      id: 'rt-schedule-block',
      fields: [
        { name: 'provider_id', display: 'Provider', type: 'relation', required: true, options: { record_type: 'employee' } },
        { name: 'block_date', display: 'Date', type: 'date', required: true },
        { name: 'start_time', display: 'Start Time', type: 'datetime', required: true },
        { name: 'end_time', display: 'End Time', type: 'datetime', required: true },
        { name: 'block_type', display: 'Type', type: 'select', required: true, options: ['Lunch', 'Meeting', 'Admin Time', 'Unavailable', 'Holiday'] },
        { name: 'reason', display: 'Reason', type: 'text', required: false },
        { name: 'recurring', display: 'Recurring', type: 'boolean', required: false }
      ]
    },
    {
      id: 'rt-consent',
      fields: [
        { name: 'patient_id', display: 'Patient', type: 'relation', required: true, options: { record_type: 'patient' } },
        { name: 'consent_type', display: 'Consent Type', type: 'select', required: true, options: ['Treatment', 'Surgery', 'Anesthesia', 'Research', 'Photography', 'Information Release'] },
        { name: 'consent_date', display: 'Date', type: 'date', required: true },
        { name: 'expiry_date', display: 'Expiry Date', type: 'date', required: false },
        { name: 'signed_by', display: 'Signed By', type: 'text', required: true },
        { name: 'witness', display: 'Witness', type: 'text', required: false },
        { name: 'details', display: 'Details', type: 'textarea', required: true }
      ]
    },
    {
      id: 'rt-referral',
      fields: [
        { name: 'patient_id', display: 'Patient', type: 'relation', required: true, options: { record_type: 'patient' } },
        { name: 'referring_provider_id', display: 'Referring Provider', type: 'relation', required: true, options: { record_type: 'employee' } },
        { name: 'referral_date', display: 'Referral Date', type: 'date', required: true },
        { name: 'specialist_name', display: 'Specialist Name', type: 'text', required: true },
        { name: 'specialty', display: 'Specialty', type: 'text', required: true },
        { name: 'reason', display: 'Reason for Referral', type: 'textarea', required: true },
        { name: 'urgency', display: 'Urgency', type: 'select', required: true, options: ['Routine', 'Urgent', 'Emergency'] },
        { name: 'status', display: 'Status', type: 'select', required: true, options: ['Pending', 'Sent', 'Accepted', 'Completed', 'Cancelled'] }
      ]
    },
    {
      id: 'rt-note',
      fields: [
        { name: 'patient_id', display: 'Patient', type: 'relation', required: true, options: { record_type: 'patient' } },
        { name: 'visit_id', display: 'Visit', type: 'relation', required: true, options: { record_type: 'visit' } },
        { name: 'provider_id', display: 'Provider', type: 'relation', required: true, options: { record_type: 'employee' } },
        { name: 'note_date', display: 'Date', type: 'datetime', required: true },
        { name: 'note_type', display: 'Type', type: 'select', required: true, options: ['Progress Note', 'SOAP Note', 'Discharge Summary', 'Consultation Note', 'Procedure Note'] },
        { name: 'chief_complaint', display: 'Chief Complaint', type: 'text', required: false },
        { name: 'subjective', display: 'Subjective', type: 'textarea', required: false },
        { name: 'objective', display: 'Objective', type: 'textarea', required: false },
        { name: 'assessment', display: 'Assessment', type: 'textarea', required: false },
        { name: 'plan', display: 'Plan', type: 'textarea', required: false }
      ]
    },
    {
      id: 'rt-task',
      fields: [
        { name: 'title', display: 'Task Title', type: 'text', required: true },
        { name: 'description', display: 'Description', type: 'textarea', required: false },
        { name: 'assigned_to', display: 'Assigned To', type: 'relation', required: true, options: { record_type: 'employee' } },
        { name: 'created_by', display: 'Created By', type: 'relation', required: true, options: { record_type: 'employee' } },
        { name: 'due_date', display: 'Due Date', type: 'datetime', required: false },
        { name: 'priority', display: 'Priority', type: 'select', required: true, options: ['Low', 'Medium', 'High', 'Urgent'] },
        { name: 'status', display: 'Status', type: 'select', required: true, options: ['To Do', 'In Progress', 'Review', 'Completed', 'Cancelled'] },
        { name: 'completion_date', display: 'Completion Date', type: 'datetime', required: false }
      ]
    },
    {
      id: 'rt-incident',
      fields: [
        { name: 'incident_date', display: 'Incident Date', type: 'datetime', required: true },
        { name: 'incident_type', display: 'Type', type: 'select', required: true, options: ['Patient Fall', 'Medication Error', 'Equipment Failure', 'Security', 'Other'] },
        { name: 'location', display: 'Location', type: 'text', required: true },
        { name: 'description', display: 'Description', type: 'textarea', required: true },
        { name: 'reported_by', display: 'Reported By', type: 'relation', required: true, options: { record_type: 'employee' } },
        { name: 'severity', display: 'Severity', type: 'select', required: true, options: ['Minor', 'Moderate', 'Major', 'Critical'] },
        { name: 'action_taken', display: 'Action Taken', type: 'textarea', required: false },
        { name: 'follow_up_required', display: 'Follow-up Required', type: 'boolean', required: false },
        { name: 'status', display: 'Status', type: 'select', required: true, options: ['Open', 'Under Investigation', 'Resolved', 'Closed'] }
      ]
    },
    {
      id: 'rt-equipment',
      fields: [
        { name: 'equipment_name', display: 'Equipment Name', type: 'text', required: true },
        { name: 'serial_number', display: 'Serial Number', type: 'text', required: true },
        { name: 'model', display: 'Model', type: 'text', required: false },
        { name: 'manufacturer', display: 'Manufacturer', type: 'text', required: false },
        { name: 'purchase_date', display: 'Purchase Date', type: 'date', required: false },
        { name: 'last_maintenance', display: 'Last Maintenance', type: 'date', required: false },
        { name: 'next_maintenance', display: 'Next Maintenance', type: 'date', required: false },
        { name: 'location', display: 'Location', type: 'text', required: true },
        { name: 'status', display: 'Status', type: 'select', required: true, options: ['Active', 'Maintenance', 'Repair', 'Retired'] }
      ]
    }
  ];

  const insertFieldDef = db.prepare(`
    INSERT OR IGNORE INTO field_definitions (
      id, record_type_id, field_name, display_name, field_type, 
      is_required, options, order_index
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let totalFields = 0;
  
  for (const recordType of recordTypes) {
    let orderIndex = 0;
    for (const field of recordType.fields) {
      const fieldId = `${recordType.id}-field-${field.name}`;
      
      let options = null;
      if (field.options) {
        if (Array.isArray(field.options)) {
          options = JSON.stringify(field.options);
        } else {
          options = JSON.stringify(field.options);
        }
      }
      
      insertFieldDef.run(
        fieldId,
        recordType.id,
        field.name,
        field.display,
        field.type,
        field.required ? 1 : 0,
        options,
        orderIndex++
      );
      totalFields++;
    }
    console.log(`Created fields for ${recordType.id}`);
  }
  
  console.log(`Field definitions created! Total: ${totalFields} fields`);
  return totalFields;
}

// Auto-run when imported
seedNewRecordTypes();