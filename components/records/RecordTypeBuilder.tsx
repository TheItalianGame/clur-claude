'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { FieldDefinition } from '@/lib/types';

interface RecordTypeBuilderProps {
  onSave?: (recordType: any) => void;
  onCancel?: () => void;
}

interface ExtendedFieldDefinition extends Partial<FieldDefinition> {
  related_record_type?: string;
  show_in_employee_calendar?: boolean;
}

export default function RecordTypeBuilder({ onSave, onCancel }: RecordTypeBuilderProps) {
  const [recordName, setRecordName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [categoryId, setCategoryId] = useState('cat-custom');
  const [categories, setCategories] = useState<any[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [fields, setFields] = useState<ExtendedFieldDefinition[]>([
    {
      field_name: '',
      display_name: '',
      field_type: 'text',
      is_required: false,
      default_value: '',
      related_record_type: '',
      show_in_employee_calendar: false
    }
  ]);
  const [dateField, setDateField] = useState('');
  const [titleField, setTitleField] = useState('');
  const [recordTypes, setRecordTypes] = useState<any[]>([]);

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'datetime', label: 'Date & Time' },
    { value: 'select', label: 'Dropdown (Custom Options)' },
    { value: 'multiselect', label: 'Multi-Select (Custom Options)' },
    { value: 'relation', label: 'Dropdown (Related Record)' },
    { value: 'multiselect_relation', label: 'Multi-Select (Related Records)' },
    { value: 'boolean', label: 'Checkbox' },
  ];

  useEffect(() => {
    fetchRecordTypes();
    fetchCategories();
  }, []);

  const fetchRecordTypes = async () => {
    try {
      const response = await fetch('/api/record-types');
      const data = await response.json();
      setRecordTypes(data);
    } catch (error) {
      console.error('Error fetching record types:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const createNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    const categoryIdName = newCategoryName.toLowerCase().replace(/\s+/g, '_');
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `cat-${categoryIdName}`,
          name: categoryIdName,
          display_name: newCategoryName,
          icon: 'Folder',
          color: '#6B7280',
          order_index: 999
        })
      });
      
      if (response.ok) {
        const newCategory = await response.json();
        await fetchCategories();
        setCategoryId(newCategory.id);
        setShowNewCategory(false);
        setNewCategoryName('');
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const addField = () => {
    setFields([...fields, {
      field_name: '',
      display_name: '',
      field_type: 'text',
      is_required: false,
      default_value: '',
      related_record_type: '',
      show_in_employee_calendar: false
    }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<ExtendedFieldDefinition>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const handleSave = async () => {
    if (!recordName || !displayName || fields.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    const recordTypeId = recordName.toLowerCase().replace(/\s+/g, '_');
    
    const recordType = {
      id: recordTypeId,
      name: recordTypeId,
      display_name: displayName,
      color: color,
      category_id: categoryId || 'cat-custom',
      is_system: false
    };

    const validFields = fields.filter(f => f.field_name && f.display_name).map(field => {
      // For relation and multiselect_relation fields, store the related record type in the options field
      if ((field.field_type === 'relation' || field.field_type === 'multiselect_relation') && field.related_record_type) {
        // Change field_type from multiselect_relation to multiselect for storage
        const fieldType = field.field_type === 'multiselect_relation' ? 'multiselect' : field.field_type;
        return {
          ...field,
          field_type: fieldType,
          options: JSON.stringify({ record_type: field.related_record_type }),
          show_in_employee_calendar: field.show_in_employee_calendar || false
        };
      }
      // For select and multiselect fields, convert comma-separated options to JSON array
      if ((field.field_type === 'select' || field.field_type === 'multiselect') && field.options) {
        const optionsArray = field.options.split(',').map(opt => opt.trim()).filter(opt => opt);
        return {
          ...field,
          options: JSON.stringify(optionsArray)
        };
      }
      return field;
    });

    try {
      const response = await fetch('/api/record-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordType,
          fields: validFields,
          calendarSettings: {
            date_field: dateField || 'created_at',
            title_field: titleField || validFields[0]?.field_name || 'id',
            show_on_calendar: true
          }
        })
      });

      if (response.ok) {
        onSave?.({ recordType, fields: validFields });
      } else {
        alert('Failed to create record type');
      }
    } catch (error) {
      console.error('Error creating record type:', error);
      alert('Error creating record type');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold dark:text-gray-100">Create New Record Type</h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Record Name (Internal)
            </label>
            <input
              type="text"
              value={recordName}
              onChange={(e) => setRecordName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., prescription"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Prescription"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <div className="flex gap-2">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.display_name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowNewCategory(!showNewCategory)}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {showNewCategory && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={createNewCategory}
                  className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Create
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Fields */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold dark:text-gray-100">Fields</h3>
            <button
              onClick={addField}
              className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Field
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex gap-3 items-start">
                  <div className="flex-1 grid grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={field.field_name}
                      onChange={(e) => updateField(index, { field_name: e.target.value })}
                      placeholder="Field name"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={field.display_name}
                      onChange={(e) => updateField(index, { display_name: e.target.value })}
                      placeholder="Display name"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={field.field_type}
                      onChange={(e) => updateField(index, { field_type: e.target.value as any })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {fieldTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={field.is_required}
                          onChange={(e) => updateField(index, { is_required: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm dark:text-gray-300">Required</span>
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={() => removeField(index)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {/* Show record type selector for relation and multiselect_relation fields */}
                {(field.field_type === 'relation' || field.field_type === 'multiselect_relation') && (
                  <div className="mt-3 pl-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Select Related Record Type
                    </label>
                    <select
                      value={field.related_record_type || ''}
                      onChange={(e) => updateField(index, { related_record_type: e.target.value })}
                      className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select record type...</option>
                      {recordTypes.map(rt => (
                        <option key={rt.id} value={rt.id}>{rt.display_name}</option>
                      ))}
                    </select>
                    {field.related_record_type === 'employee' && (
                      <label className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          checked={field.show_in_employee_calendar || false}
                          onChange={(e) => updateField(index, { show_in_employee_calendar: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm dark:text-gray-300">
                          {field.field_type === 'multiselect_relation' 
                            ? "Show in selected employees' calendars" 
                            : "Show in employee's calendar"}
                        </span>
                      </label>
                    )}
                  </div>
                )}
                {/* Show options input for select and multiselect fields */}
                {(field.field_type === 'select' || field.field_type === 'multiselect') && (
                  <div className="mt-3 pl-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Options (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={field.options || ''}
                      onChange={(e) => updateField(index, { options: e.target.value })}
                      placeholder="Option1, Option2, Option3"
                      className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Settings */}
        <div>
          <h3 className="text-lg font-semibold dark:text-gray-100 mb-3">Calendar Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date Field (for calendar placement)
              </label>
              <select
                value={dateField}
                onChange={(e) => setDateField(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Use created_at</option>
                {fields.filter(f => f.field_type === 'date' || f.field_type === 'datetime').map((field, index) => (
                  <option key={index} value={field.field_name}>{field.display_name || field.field_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title Field (for calendar display)
              </label>
              <select
                value={titleField}
                onChange={(e) => setTitleField(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select field</option>
                {fields.filter(f => f.field_name).map((field, index) => (
                  <option key={index} value={field.field_name}>{field.display_name || field.field_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Record Type
          </button>
        </div>
      </div>
    </div>
  );
}