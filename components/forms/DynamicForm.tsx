'use client';

import { useState, useEffect } from 'react';
import { FieldDefinition, RecordType, FormDefinition } from '@/lib/types';
import { Save, X, Layout } from 'lucide-react';
import { generateDefaultFormLayout } from '@/lib/form-templates';

interface DynamicFormProps {
  recordType: RecordType;
  initialData?: any;
  formId?: string;
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

export default function DynamicForm({ recordType, initialData, formId, onSave, onCancel }: DynamicFormProps) {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [formData, setFormData] = useState<any>(initialData || {});
  const [relatedData, setRelatedData] = useState<{ [key: string]: any[] }>({});
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [formLayout, setFormLayout] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFields();
    fetchForm();
  }, [recordType, formId]);

  const fetchForm = async () => {
    try {
      // If formId is provided, use that specific form
      if (formId) {
        const response = await fetch(`/api/forms/${formId}`);
        const data = await response.json();
        setForm(data);
        setFormLayout(JSON.parse(data.layout));
      } else {
        // Otherwise, get the default form for this record type
        const response = await fetch(`/api/forms?record_type_id=${recordType.id}`);
        const forms = await response.json();
        const defaultForm = forms.find((f: FormDefinition) => f.is_default);
        
        if (defaultForm) {
          setForm(defaultForm);
          setFormLayout(JSON.parse(defaultForm.layout));
        }
      }
    } catch (error) {
      console.error('Error fetching form:', error);
    }
  };

  const fetchFields = async () => {
    try {
      const response = await fetch(`/api/record-types/${recordType.id}/fields`);
      const data = await response.json();
      setFields(data);
      
      // Fetch related data for relation and multiselect fields
      const relationFields = data.filter((f: FieldDefinition) => f.field_type === 'relation' || f.field_type === 'multiselect');
      for (const field of relationFields) {
        let relatedType = null;
        
        // Check if options contains record type information
        if (field.options) {
          try {
            const options = JSON.parse(field.options);
            if (options.record_type) {
              relatedType = options.record_type;
            }
          } catch (e) {
            // If not JSON, it might be a regular multiselect with custom options - skip
            if (field.field_type === 'multiselect') {
              continue;
            }
            // For relation fields, fall back to field name detection
            if (field.field_name.includes('patient')) relatedType = 'patient';
            if (field.field_name.includes('provider') || field.field_name.includes('manager') || field.field_name.includes('attendees')) relatedType = 'employee';
          }
        } else if (field.field_type === 'relation') {
          // Fall back to field name detection for relation fields
          if (field.field_name.includes('patient')) relatedType = 'patient';
          if (field.field_name.includes('provider') || field.field_name.includes('manager')) relatedType = 'employee';
        }
        
        if (relatedType) {
          const relatedResponse = await fetch(`/api/records/${relatedType}`);
          const relatedRecords = await relatedResponse.json();
          setRelatedData(prev => ({ ...prev, [field.field_name]: relatedRecords }));
        }
      }
      
      // If no form layout exists, generate a default one
      if (!formLayout) {
        const defaultLayout = generateDefaultFormLayout(data);
        setFormLayout(defaultLayout);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching fields:', error);
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData({ ...formData, [fieldName]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const missingRequired = fields.filter(f => f.is_required && !formData[f.field_name]);
    if (missingRequired.length > 0) {
      alert(`Please fill in required fields: ${missingRequired.map(f => f.display_name).join(', ')}`);
      return;
    }
    
    // If onSave is provided, let the parent handle saving
    // Otherwise, save directly
    if (onSave) {
      onSave(formData);
    } else {
      try {
        const response = await fetch(`/api/records/${recordType.id}`, {
          method: initialData ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
          alert('Failed to save record');
        }
      } catch (error) {
        console.error('Error saving record:', error);
        alert('Error saving record');
      }
    }
  };

  const renderField = (field: FieldDefinition) => {
    const value = formData[field.field_name] || '';
    
    switch (field.field_type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.is_required}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            required={field.is_required}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.is_required}
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.is_required}
          />
        );
      
      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.is_required}
          />
        );
      
      case 'boolean':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleFieldChange(field.field_name, e.target.checked)}
              className="w-4 h-4"
            />
            <span>Yes</span>
          </label>
        );
      
      case 'select':
        const options = field.options ? JSON.parse(field.options) : [];
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.is_required}
          >
            <option value="">Select {field.display_name}</option>
            {options.map((opt: string | { value: string, label: string }) => {
              if (typeof opt === 'string') {
                return <option key={opt} value={opt}>{opt}</option>;
              }
              return <option key={opt.value} value={opt.value}>{opt.label}</option>;
            })}
          </select>
        );
      
      case 'multiselect':
        let multiOptions: any[] = [];
        
        // Handle different option formats
        if (field.options) {
          try {
            const parsed = JSON.parse(field.options);
            if (Array.isArray(parsed)) {
              multiOptions = parsed;
            } else if (parsed.record_type) {
              // This is a relation multiselect - use related records
              multiOptions = relatedData[field.field_name] || [];
            }
          } catch (e) {
            console.error('Error parsing multiselect options:', e);
            multiOptions = [];
          }
        }
        
        const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);
        
        // Check if this is a relation multiselect (for employees, etc.)
        const isRelation = field.options && field.options.includes('record_type');
        
        if (isRelation && multiOptions.length > 0) {
          // Render as employee/relation multiselect
          return (
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 max-h-40 overflow-y-auto">
              {multiOptions.map((record: any) => {
                const recordId = record.id;
                const recordLabel = record.first_name && record.last_name 
                  ? `${record.first_name} ${record.last_name}`
                  : record.name || record.title || record.id;
                
                return (
                  <label key={recordId} className="flex items-center gap-2 p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(recordId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleFieldChange(field.field_name, [...selectedValues, recordId]);
                        } else {
                          handleFieldChange(field.field_name, selectedValues.filter((v: string) => v !== recordId));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{recordLabel}</span>
                  </label>
                );
              })}
            </div>
          );
        } else if (Array.isArray(multiOptions)) {
          // Render as regular multiselect with custom options
          return (
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 max-h-40 overflow-y-auto">
              {multiOptions.map((opt: string | { value: string, label: string }) => {
                const optValue = typeof opt === 'string' ? opt : opt.value;
                const optLabel = typeof opt === 'string' ? opt : opt.label;
                return (
                  <label key={optValue} className="flex items-center gap-2 p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(optValue)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleFieldChange(field.field_name, [...selectedValues, optValue]);
                        } else {
                          handleFieldChange(field.field_name, selectedValues.filter((v: string) => v !== optValue));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{optLabel}</span>
                  </label>
                );
              })}
            </div>
          );
        } else {
          // Fallback to empty state
          return (
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-gray-500 text-sm">
              No options available
            </div>
          );
        };
      
      case 'relation':
        const relatedRecords = relatedData[field.field_name] || [];
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.is_required}
          >
            <option value="">Select {field.display_name}</option>
            {relatedRecords.map((record: any) => (
              <option key={record.id} value={record.id}>
                {record.first_name && record.last_name 
                  ? `${record.first_name} ${record.last_name}`
                  : record.name || record.title || record.id}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.is_required}
          />
        );
    }
  };

  if (loading) {
    return <div className="p-6">Loading form...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold dark:text-gray-100">
          {initialData ? 'Edit' : 'New'} {recordType.display_name}
        </h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {formLayout ? (
        <div>
          {formLayout.sections.map((section: any) => {
            // Handle old format where fields might be 'all' string
            let sectionFields = [];
            if (section.fields === 'all' || !Array.isArray(section.fields)) {
              // Use all fields in order
              sectionFields = fields.map(f => ({
                fieldId: f.id,
                width: f.field_type === 'textarea' ? 'full' : 'half'
              }));
            } else {
              sectionFields = section.fields;
            }
            
            return (
              <div key={section.id || section.title} className="mb-6">
                {(section.name || section.title) && (section.name || section.title) !== 'General Information' && (
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                    {section.name || section.title}
                  </h3>
                )}
                
                <div className={`grid grid-cols-${section.columns || 2} gap-4`}>
                  {sectionFields.map((fieldLayout: any) => {
                    const field = fields.find(f => f.id === fieldLayout.fieldId);
                    if (!field) return null;
                    
                    return (
                      <div
                        key={field.id}
                        className={fieldLayout.width === 'full' ? `col-span-${section.columns || 2}` : ''}
                      >
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {field.display_name}
                          {field.is_required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderField(field)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Fallback to default layout if no custom layout
        <div className="grid grid-cols-2 gap-4">
          {fields.map(field => (
            <div key={field.id} className={field.field_type === 'textarea' ? 'col-span-2' : ''}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {field.display_name}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Save className="w-4 h-4" />
          Save {recordType.display_name}
        </button>
      </div>
    </form>
  );
}