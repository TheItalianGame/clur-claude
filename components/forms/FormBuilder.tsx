'use client';

import { useState, useEffect } from 'react';
import { RecordType, FieldDefinition, FormDefinition } from '@/lib/types';
import { 
  Plus, Trash2, Edit2, Save, X, Move, 
  ChevronUp, ChevronDown, Settings, Eye
} from 'lucide-react';
import FormLayoutEditor from './FormLayoutEditor';

interface FormBuilderProps {
  recordType: RecordType;
  formId?: string;
  onSave?: (form: any) => void;
  onCancel?: () => void;
}

export default function FormBuilder({ recordType, formId, onSave, onCancel }: FormBuilderProps) {
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [formName, setFormName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [layout, setLayout] = useState<any>({
    sections: [
      {
        id: 'main',
        name: 'General Information',
        columns: 2,
        fields: []
      }
    ]
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'layout' | 'preview'>('layout');
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');

  useEffect(() => {
    fetchFields();
    if (formId) {
      fetchForm();
    } else {
      setFormName(`${recordType.display_name} Form`);
      setLoading(false);
    }
  }, [recordType, formId]);

  const fetchFields = async () => {
    try {
      const response = await fetch(`/api/record-types/${recordType.id}/fields`);
      const data = await response.json();
      setFields(data);
      
      if (!formId) {
        // Auto-populate layout with all fields for new forms
        setLayout({
          sections: [
            {
              id: 'main',
              name: 'General Information',
              columns: 2,
              fields: data.map((field: FieldDefinition) => ({
                fieldId: field.id,
                width: field.field_type === 'textarea' ? 'full' : 'half'
              }))
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
    }
  };

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${formId}`);
      const data = await response.json();
      setForm(data);
      setFormName(data.name);
      setIsDefault(data.is_default);
      setLayout(JSON.parse(data.layout));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching form:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // If it's a default form and we're editing, force Save As
    if (form?.is_default && formId) {
      setShowSaveAsDialog(true);
      setSaveAsName(`${formName} (Copy)`);
      return;
    }

    const formData = {
      record_type_id: recordType.id,
      name: formName,
      is_default: isDefault,
      layout: JSON.stringify(layout)
    };

    try {
      const response = await fetch(
        formId ? `/api/forms/${formId}` : '/api/forms',
        {
          method: formId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        }
      );

      if (response.ok) {
        const savedForm = await response.json();
        onSave?.(savedForm);
      } else {
        alert('Failed to save form');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Error saving form');
    }
  };

  const handleSaveAs = async () => {
    if (!saveAsName.trim()) {
      alert('Please enter a name for the new form');
      return;
    }

    const formData = {
      record_type_id: recordType.id,
      name: saveAsName,
      is_default: false,
      layout: JSON.stringify(layout)
    };

    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const savedForm = await response.json();
        setShowSaveAsDialog(false);
        setSaveAsName('');
        onSave?.(savedForm);
      } else {
        alert('Failed to save form as new');
      }
    } catch (error) {
      console.error('Error saving form as new:', error);
      alert('Error saving form as new');
    }
  };

  const handleLayoutChange = (newLayout: any) => {
    setLayout(newLayout);
  };

  if (loading) {
    return <div className="p-6">Loading form builder...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6">
          <div className="flex-1">
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Form Name"
              className="text-2xl font-bold bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none dark:text-gray-100"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Default Form</span>
            </label>
            
            {onCancel && (
              <button
                onClick={onCancel}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('layout')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'layout'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Layout Editor
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'preview'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Preview
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'layout' ? (
          <FormLayoutEditor
            fields={fields}
            layout={layout}
            onChange={handleLayoutChange}
          />
        ) : (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
            <FormPreview
              fields={fields}
              layout={layout}
              recordType={recordType}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Form
        </button>
      </div>
    </div>
  );
}

function FormPreview({ 
  fields, 
  layout, 
  recordType 
}: { 
  fields: FieldDefinition[], 
  layout: any, 
  recordType: RecordType 
}) {
  const renderField = (field: FieldDefinition) => {
    switch (field.field_type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={`Enter ${field.display_name}`}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg"
            disabled
          />
        );
      case 'textarea':
        return (
          <textarea
            placeholder={`Enter ${field.display_name}`}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg"
            rows={3}
            disabled
          />
        );
      case 'number':
        return (
          <input
            type="number"
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg"
            disabled
          />
        );
      case 'date':
        return (
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg"
            disabled
          />
        );
      case 'datetime':
        return (
          <input
            type="datetime-local"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg"
            disabled
          />
        );
      case 'boolean':
        return (
          <label className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" disabled />
            <span>Yes</span>
          </label>
        );
      case 'select':
      case 'relation':
        return (
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg"
            disabled
          >
            <option>Select {field.display_name}</option>
          </select>
        );
      case 'multiselect':
        return (
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 min-h-[40px] text-gray-400">
            Select multiple options...
          </div>
        );
      default:
        return (
          <input
            type="text"
            placeholder={`Enter ${field.display_name}`}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg"
            disabled
          />
        );
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">
        Form Preview: {recordType.display_name}
      </h3>
      
      {layout.sections.map((section: any) => (
        <div key={section.id} className="mb-6">
          {section.name && (
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
              {section.name}
            </h4>
          )}
          
          <div className={`grid grid-cols-${section.columns || 2} gap-4`}>
            {section.fields.map((fieldLayout: any) => {
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
      ))}
    </div>
  );
}