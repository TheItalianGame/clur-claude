'use client';

import { useState, useEffect } from 'react';
import { RecordType } from '@/lib/types';
import FormManager from '@/components/forms/FormManager';
import { FileText, Plus, Settings } from 'lucide-react';

export default function FormsPage() {
  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
  const [selectedRecordType, setSelectedRecordType] = useState<RecordType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecordTypes();
  }, []);

  const fetchRecordTypes = async () => {
    try {
      const response = await fetch('/api/record-types');
      const data = await response.json();
      setRecordTypes(data);
      if (data.length > 0) {
        setSelectedRecordType(data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching record types:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading forms...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <FileText className="w-8 h-8" />
            Form Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Design and customize forms for your record types
          </p>
        </div>

        {recordTypes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
            <Settings className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Record Types Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create a record type first to start building forms
            </p>
            <a
              href="/record-types"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Record Type
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Record Type:
                </label>
              </div>
              <div className="flex gap-2 flex-wrap">
                {recordTypes.map(rt => (
                  <button
                    key={rt.id}
                    onClick={() => setSelectedRecordType(rt)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedRecordType?.id === rt.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    style={{
                      backgroundColor: selectedRecordType?.id === rt.id ? rt.color : undefined
                    }}
                  >
                    {rt.display_name}
                  </button>
                ))}
              </div>
            </div>

            {selectedRecordType && (
              <FormManager recordType={selectedRecordType} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}