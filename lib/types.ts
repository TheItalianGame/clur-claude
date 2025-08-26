export interface RecordCategory {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color: string;
  order_index: number;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecordType {
  id: string;
  name: string;
  display_name: string;
  category_id?: string;
  category?: RecordCategory;
  description?: string;
  color: string;
  icon?: string;
  show_in_calendar: boolean;
  show_in_sidebar: boolean;
  allow_create: boolean;
  allow_edit: boolean;
  allow_delete: boolean;
  requires_patient: boolean;
  requires_visit: boolean;
  order_index: number;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface FieldDefinition {
  id: string;
  record_type_id: string;
  field_name: string;
  display_name: string;
  field_type: 'text' | 'number' | 'date' | 'datetime' | 'select' | 'multiselect' | 'boolean' | 'relation' | 'textarea';
  is_required: boolean;
  default_value?: string;
  options?: string;
  validation_rules?: string;
  order_index: number;
  show_in_employee_calendar?: boolean;
  show_on_calendar?: boolean;
  read_only?: boolean;
  is_system?: boolean;
  created_at: string;
}

export interface FormDefinition {
  id: string;
  record_type_id: string;
  name: string;
  is_default: boolean;
  layout: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarSettings {
  id: string;
  record_type_id: string;
  date_field: string;
  title_field: string;
  show_on_calendar: boolean;
  created_at: string;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role?: string;
  department?: string;
  hire_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  emergency_contact?: string;
  medical_record_number?: string;
  insurance_info?: string;
  primary_provider_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  patient_id: string;
  provider_id: string;
  visit_date: string;
  visit_type: string;
  reason?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  organizer_id: string;
  attendees?: string;
  meeting_type?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DynamicRecord {
  id: string;
  record_type_id: string;
  data: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  recordId?: string;
  title: string;
  date: Date;
  dateField?: string;
  dateFieldDisplay?: string;
  color: string;
  recordType: string;
  recordTypeDisplay: string;
  data: any;
}

export interface RecordRelationship {
  id: string;
  source_record_id: string;
  source_record_type: string;
  target_record_id: string;
  target_record_type: string;
  relationship_type: 'parent' | 'child' | 'related' | 'attachment';
  metadata?: string;
  created_at: string;
}