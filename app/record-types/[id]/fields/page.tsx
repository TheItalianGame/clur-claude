'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Save, Trash2, X, GripVertical } from 'lucide-react';
import { RecordType, FieldDefinition } from '@/lib/types';

export default function RecordTypeFieldsPage() {
  const params = useParams();
  const router = useRouter();
  const recordTypeId = params.id as string;
  
  const [recordType, setRecordType] = useState<RecordType | null>(null);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newField, setNewField] = useState<Partial<FieldDefinition>>({
    field_name: '',
    display_name: '',
    field_type: 'text',
    is_required: false,
    default_value: ''
  });
  const [showNewField, setShowNewField] = useState(false);
  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'datetime', label: 'Date & Time' },
    { value: 'select', label: 'Dropdown' },
    { value: 'multiselect', label: 'Multi-Select' },
    { value: 'relation', label: 'Relation' },
    { value: 'boolean', label: 'Checkbox' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'url', label: 'URL' }
  ];

  useEffect(() => {
    fetchRecordType();
    fetchFields();
    fetchRecordTypes();
  }, [recordTypeId]);

  const fetchRecordType = async () => {
    try {
      const response = await fetch(`/api/record-types`);
      const types = await response.json();
      const type = types.find((t: RecordType) => t.id === recordTypeId);
      setRecordType(type);
    } catch (error) {
      console.error('Error fetching record type:', error);
    }
  };

  const fetchFields = async () => {
    try {
      const response = await fetch(`/api/record-types/${recordTypeId}/fields`);
      const data = await response.json();
      // Remove cf_ prefix from field names for display in custom record types
      const processedFields = data.map((field: any) => ({
        ...field,
        field_name: field.field_name.startsWith('cf_') 
          ? field.field_name.substring(3) 
          : field.field_name,
        is_system: field.is_system || false
      }));
      setFields(processedFields);
    } catch (error) {
      console.error('Error fetching fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordTypes = async () => {
    try {
      const response = await fetch('/api/record-types');
      const data = await response.json();
      setRecordTypes(data);
    } catch (error) {
      console.error('Error fetching record types:', error);
    }
  };

  const handleAddField = async () => {
    if (!newField.field_name || !newField.display_name) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      // For custom record types, field names shouldn't have cf_ prefix in the API
      // The backend will handle adding it
      const fieldData = {
        ...newField,
        id: `field-${recordTypeId}-${Date.now()}`,
        record_type_id: recordTypeId,
        order_index: fields.length
      };

      // Handle select/multiselect options
      if ((newField.field_type === 'select' || newField.field_type === 'multiselect') && newField.options) {
        const optionsArray = (newField.options as string).split(',').map(opt => opt.trim()).filter(opt => opt);
        fieldData.options = JSON.stringify(optionsArray);
      }

      // Handle relation options
      if (newField.field_type === 'relation' && newField.options) {
        fieldData.options = JSON.stringify({ record_type: newField.options });
      }

      const response = await fetch(`/api/record-types/${recordTypeId}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldData)
      });

      if (response.ok) {
        await fetchFields();
        setNewField({
          field_name: '',
          display_name: '',
          field_type: 'text',
          is_required: false,
          default_value: ''
        });
        setShowNewField(false);
      }
    } catch (error) {
      console.error('Error adding field:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Are you sure you want to delete this field?')) return;

    try {
      const response = await fetch(`/api/record-types/${recordTypeId}/fields/${fieldId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchFields();
      }
    } catch (error) {
      console.error('Error deleting field:', error);
    }
  };

  const handleUpdateField = async (field: FieldDefinition) => {
    try {
      const response = await fetch(`/api/record-types/${recordTypeId}/fields/${field.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(field)
      });

      if (response.ok) {
        await fetchFields();
      }
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading fields...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!recordType) {
    return (
      <div className="p-6">
        <div className="text-xl">Record type not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {recordType.display_name} - Field Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage the fields for this record type
            </p>
          </div>
          <button
            onClick={() => setShowNewField(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            Add Field
          </button>
        </div>

        {showNewField && (
          <div className="mb-6 p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <h3 className="font-bold mb-4 text-gray-900 dark:text-gray-100">Add New Field</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Field Name (Internal)
                </label>
                <input
                  type="text"
                  value={newField.field_name}
                  onChange={(e) => setNewField({ ...newField, field_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., patient_name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newField.display_name}
                  onChange={(e) => setNewField({ ...newField, display_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Patient Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Field Type
                </label>
                <select
                  value={newField.field_type}
                  onChange={(e) => setNewField({ ...newField, field_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {fieldTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Default Value
                </label>
                <input
                  type="text"
                  value={newField.default_value || ''}
                  onChange={(e) => setNewField({ ...newField, default_value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
              
              {(newField.field_type === 'select' || newField.field_type === 'multiselect') && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Options (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newField.options || ''}
                    onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Option 1, Option 2, Option 3"
                  />
                </div>
              )}
              
              {(newField.field_type === 'date' || newField.field_type === 'datetime') && (
                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newField.show_on_calendar || false}
                      onChange={(e) => setNewField({ ...newField, show_on_calendar: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show on Calendar
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                    Display records on the calendar using this date field
                  </p>
                </div>
              )}
              
              {newField.field_type === 'relation' && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Related Record Type
                  </label>
                  <select
                    value={newField.options || ''}
                    onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a record type</option>
                    {recordTypes.map(type => (
                      <option key={type.id} value={type.name}>
                        {type.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newField.is_required}
                    onChange={(e) => setNewField({ ...newField, is_required: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Required Field</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddField}
                disabled={saving}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Add Field'}
              </button>
              <button
                onClick={() => {
                  setShowNewField(false);
                  setNewField({
                    field_name: '',
                    display_name: '',
                    field_type: 'text',
                    is_required: false,
                    default_value: ''
                  });
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {fields.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No fields defined. Click "Add Field" to create your first field.
            </p>
          ) : (
            fields.map((field: any, index) => (
              <div
                key={field.id}
                className={`flex items-center gap-4 p-4 border rounded-lg ${
                  field.is_system ? 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <GripVertical className={`w-5 h-5 ${field.is_system ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{field.display_name}</span>
                    {field.is_system && (
                      <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                        System Field
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {field.field_name} • {field.field_type}
                    {field.is_required && ' • Required'}
                    {field.default_value && ` • Default: ${field.default_value}`}
                    {field.show_on_calendar && ' • Shows on Calendar'}
                    {field.show_in_employee_calendar && ' • Employee Calendar'}
                  </div>
                </div>
                {!field.is_system && (
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}