'use client';

import { useState, useEffect } from 'react';
import { RecordType, FormDefinition } from '@/lib/types';
import { 
  Plus, Edit2, Trash2, Copy, CheckCircle, 
  FileText, Settings, Layout
} from 'lucide-react';
import FormBuilder from './FormBuilder';

interface FormManagerProps {
  recordType?: RecordType;
}

export default function FormManager({ recordType }: FormManagerProps) {
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingForm, setEditingForm] = useState<string | null>(null);
  const [creatingForm, setCreatingForm] = useState(false);

  useEffect(() => {
    fetchForms();
  }, [recordType]);

  const fetchForms = async () => {
    try {
      const url = recordType 
        ? `/api/forms?record_type_id=${recordType.id}`
        : '/api/forms';
      const response = await fetch(url);
      const data = await response.json();
      setForms(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching forms:', error);
      setLoading(false);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return;

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchForms();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete form');
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      alert('Error deleting form');
    }
  };

  const handleDuplicateForm = async (form: FormDefinition) => {
    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record_type_id: form.record_type_id,
          name: `${form.name} (Copy)`,
          is_default: false,
          layout: form.layout
        })
      });

      if (response.ok) {
        fetchForms();
      } else {
        alert('Failed to duplicate form');
      }
    } catch (error) {
      console.error('Error duplicating form:', error);
      alert('Error duplicating form');
    }
  };

  const handleSetDefault = async (formId: string) => {
    const form = forms.find(f => f.id === formId);
    if (!form) return;

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          is_default: true
        })
      });

      if (response.ok) {
        fetchForms();
      } else {
        alert('Failed to set default form');
      }
    } catch (error) {
      console.error('Error setting default form:', error);
      alert('Error setting default form');
    }
  };

  const handleFormSaved = () => {
    setEditingForm(null);
    setCreatingForm(false);
    fetchForms();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading forms...</p>
          </div>
        </div>
      </div>
    );
  }

  if (editingForm || creatingForm) {
    return (
      <FormBuilder
        recordType={recordType!}
        formId={editingForm || undefined}
        onSave={handleFormSaved}
        onCancel={() => {
          setEditingForm(null);
          setCreatingForm(false);
        }}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold dark:text-gray-100">
              {recordType ? `${recordType.display_name} Forms` : 'Form Templates'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage form layouts and templates for {recordType ? recordType.display_name : 'all record types'}
            </p>
          </div>
          
          {recordType && (
            <button
              onClick={() => setCreatingForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Form
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {forms.length === 0 ? (
          <div className="text-center py-12">
            <Layout className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No forms created yet
            </p>
            {recordType && (
              <button
                onClick={() => setCreatingForm(true)}
                className="mt-4 text-blue-500 hover:text-blue-600"
              >
                Create your first form
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map(form => (
              <div
                key={form.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <h3 className="font-medium dark:text-gray-100">
                      {form.name}
                    </h3>
                  </div>
                  
                  {form.is_default && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Default
                    </span>
                  )}
                </div>

                {!recordType && (form as any).record_type_name && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {(form as any).record_type_name}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  {recordType && (
                    <button
                      onClick={() => setEditingForm(form.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDuplicateForm(form)}
                    className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  
                  {!form.is_default && (
                    <>
                      <button
                        onClick={() => handleSetDefault(form.id)}
                        className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Set as default"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteForm(form.id)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}