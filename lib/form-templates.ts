import { FieldDefinition } from './types';

export interface FormTemplate {
  name: string;
  description: string;
  recordTypes: string[];
  layout: {
    sections: FormSection[];
  };
}

export interface FormSection {
  id: string;
  name: string;
  columns: number;
  fields: FormField[];
}

export interface FormField {
  fieldId?: string;
  fieldName?: string;
  width: 'half' | 'full';
}

export const formTemplates: { [key: string]: FormTemplate } = {
  patient_intake: {
    name: 'Patient Intake Form',
    description: 'Standard patient intake form with demographics and medical history',
    recordTypes: ['patient'],
    layout: {
      sections: [
        {
          id: 'demographics',
          name: 'Demographics',
          columns: 2,
          fields: [
            { fieldName: 'first_name', width: 'half' },
            { fieldName: 'last_name', width: 'half' },
            { fieldName: 'date_of_birth', width: 'half' },
            { fieldName: 'gender', width: 'half' },
            { fieldName: 'email', width: 'half' },
            { fieldName: 'phone', width: 'half' },
            { fieldName: 'address', width: 'full' }
          ]
        },
        {
          id: 'medical',
          name: 'Medical Information',
          columns: 2,
          fields: [
            { fieldName: 'medical_record_number', width: 'half' },
            { fieldName: 'primary_provider_id', width: 'half' },
            { fieldName: 'insurance_info', width: 'full' },
            { fieldName: 'emergency_contact', width: 'full' }
          ]
        }
      ]
    }
  },
  
  employee_onboarding: {
    name: 'Employee Onboarding Form',
    description: 'Comprehensive employee onboarding form',
    recordTypes: ['employee'],
    layout: {
      sections: [
        {
          id: 'personal',
          name: 'Personal Information',
          columns: 2,
          fields: [
            { fieldName: 'first_name', width: 'half' },
            { fieldName: 'last_name', width: 'half' },
            { fieldName: 'email', width: 'half' },
            { fieldName: 'phone', width: 'half' }
          ]
        },
        {
          id: 'employment',
          name: 'Employment Details',
          columns: 2,
          fields: [
            { fieldName: 'role', width: 'half' },
            { fieldName: 'department', width: 'half' },
            { fieldName: 'hire_date', width: 'half' },
            { fieldName: 'manager_id', width: 'half' },
            { fieldName: 'is_active', width: 'half' }
          ]
        }
      ]
    }
  },
  
  visit_documentation: {
    name: 'Visit Documentation Form',
    description: 'Standard visit documentation form',
    recordTypes: ['visit'],
    layout: {
      sections: [
        {
          id: 'visit_info',
          name: 'Visit Information',
          columns: 2,
          fields: [
            { fieldName: 'patient_id', width: 'half' },
            { fieldName: 'provider_id', width: 'half' },
            { fieldName: 'visit_date', width: 'half' },
            { fieldName: 'visit_type', width: 'half' },
            { fieldName: 'duration_minutes', width: 'half' },
            { fieldName: 'status', width: 'half' }
          ]
        },
        {
          id: 'notes',
          name: 'Notes and Reason',
          columns: 1,
          fields: [
            { fieldName: 'reason', width: 'full' },
            { fieldName: 'notes', width: 'full' }
          ]
        }
      ]
    }
  },
  
  meeting_schedule: {
    name: 'Meeting Schedule Form',
    description: 'Form for scheduling meetings',
    recordTypes: ['meeting'],
    layout: {
      sections: [
        {
          id: 'meeting_details',
          name: 'Meeting Details',
          columns: 2,
          fields: [
            { fieldName: 'title', width: 'full' },
            { fieldName: 'description', width: 'full' },
            { fieldName: 'start_time', width: 'half' },
            { fieldName: 'end_time', width: 'half' },
            { fieldName: 'location', width: 'half' },
            { fieldName: 'meeting_type', width: 'half' },
            { fieldName: 'organizer_id', width: 'half' },
            { fieldName: 'status', width: 'half' },
            { fieldName: 'attendees', width: 'full' }
          ]
        }
      ]
    }
  },
  
  simple_form: {
    name: 'Simple Form',
    description: 'Basic single-column form layout',
    recordTypes: ['*'], // Works for any record type
    layout: {
      sections: [
        {
          id: 'main',
          name: 'Information',
          columns: 1,
          fields: [] // Will be populated with all fields
        }
      ]
    }
  },
  
  two_column_form: {
    name: 'Two Column Form',
    description: 'Standard two-column form layout',
    recordTypes: ['*'],
    layout: {
      sections: [
        {
          id: 'main',
          name: 'General Information',
          columns: 2,
          fields: [] // Will be populated with all fields
        }
      ]
    }
  },
  
  tabbed_form: {
    name: 'Tabbed Form',
    description: 'Form with multiple sections/tabs',
    recordTypes: ['*'],
    layout: {
      sections: [
        {
          id: 'basic',
          name: 'Basic Information',
          columns: 2,
          fields: []
        },
        {
          id: 'additional',
          name: 'Additional Details',
          columns: 2,
          fields: []
        },
        {
          id: 'notes',
          name: 'Notes',
          columns: 1,
          fields: []
        }
      ]
    }
  }
};

export function generateDefaultFormLayout(fields: FieldDefinition[]): any {
  // Sort fields by order_index
  const sortedFields = [...fields].sort((a, b) => a.order_index - b.order_index);
  
  // Group fields by type for better organization
  const textFields = sortedFields.filter(f => 
    ['text', 'email', 'phone', 'url'].includes(f.field_type)
  );
  const dateFields = sortedFields.filter(f => 
    ['date', 'datetime'].includes(f.field_type)
  );
  const selectionFields = sortedFields.filter(f => 
    ['select', 'multiselect', 'relation', 'boolean'].includes(f.field_type)
  );
  const largeFields = sortedFields.filter(f => 
    ['textarea', 'json', 'rich_text'].includes(f.field_type)
  );
  const otherFields = sortedFields.filter(f => 
    !textFields.includes(f) && 
    !dateFields.includes(f) && 
    !selectionFields.includes(f) && 
    !largeFields.includes(f)
  );
  
  const sections: FormSection[] = [];
  
  // Main section with most fields
  const mainFields = [
    ...textFields,
    ...dateFields,
    ...selectionFields,
    ...otherFields
  ].map(field => ({
    fieldId: field.id,
    width: field.field_type === 'textarea' ? 'full' as const : 'half' as const
  }));
  
  if (mainFields.length > 0) {
    sections.push({
      id: 'main',
      name: 'General Information',
      columns: 2,
      fields: mainFields
    });
  }
  
  // Additional section for large fields
  if (largeFields.length > 0) {
    sections.push({
      id: 'additional',
      name: 'Additional Information',
      columns: 1,
      fields: largeFields.map(field => ({
        fieldId: field.id,
        width: 'full' as const
      }))
    });
  }
  
  // If no sections were created, create a default one
  if (sections.length === 0) {
    sections.push({
      id: 'main',
      name: 'Information',
      columns: 2,
      fields: sortedFields.map(field => ({
        fieldId: field.id,
        width: field.field_type === 'textarea' ? 'full' as const : 'half' as const
      }))
    });
  }
  
  return { sections };
}

export function applyFormTemplate(
  template: FormTemplate, 
  fields: FieldDefinition[]
): any {
  const layout = JSON.parse(JSON.stringify(template.layout)); // Deep clone
  
  // For generic templates, populate with actual field IDs
  if (template.recordTypes.includes('*')) {
    const sortedFields = [...fields].sort((a, b) => a.order_index - b.order_index);
    let fieldIndex = 0;
    
    layout.sections.forEach((section: FormSection) => {
      if (section.fields.length === 0) {
        // Populate empty sections with remaining fields
        const fieldsPerSection = Math.ceil(sortedFields.length / layout.sections.length);
        const sectionFields = sortedFields.slice(
          fieldIndex, 
          fieldIndex + fieldsPerSection
        );
        
        section.fields = sectionFields.map(field => ({
          fieldId: field.id,
          width: field.field_type === 'textarea' ? 'full' : 'half'
        }));
        
        fieldIndex += fieldsPerSection;
      }
    });
  } else {
    // For specific templates, map field names to field IDs
    layout.sections.forEach((section: FormSection) => {
      section.fields = section.fields.map((fieldLayout: FormField) => {
        if (fieldLayout.fieldName) {
          const field = fields.find(f => f.field_name === fieldLayout.fieldName);
          if (field) {
            return {
              fieldId: field.id,
              width: fieldLayout.width
            };
          }
        }
        return fieldLayout;
      }).filter((f: FormField) => f.fieldId); // Remove fields that couldn't be mapped
    });
  }
  
  return layout;
}