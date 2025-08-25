'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { RecordType } from '@/lib/types';
import DynamicForm from '@/components/forms/DynamicForm';
import { ChevronLeft, Edit } from 'lucide-react';

export default function EditRecordPage() {
  const params = useParams();
  const router = useRouter();
  const recordTypeName = params.type as string;
  const recordId = params.id as string;
  
  const [recordType, setRecordType] = useState<RecordType | null>(null);
  const [recordData, setRecordData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [recordTypeName, recordId]);

  const fetchData = async () => {
    try {
      // Fetch record type
      const typesResponse = await fetch('/api/record-types');
      const types = await typesResponse.json();
      
      const currentType = types.find((t: RecordType) => t.name === recordTypeName);
      if (!currentType) {
        setLoading(false);
        return;
      }
      
      setRecordType(currentType);
      
      // Fetch record data
      const recordResponse = await fetch(`/api/records/${recordTypeName}/${recordId}`);
      if (recordResponse.ok) {
        const data = await recordResponse.json();
        setRecordData(data);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    try {
      const response = await fetch(`/api/records/${recordTypeName}/${recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        router.push(`/records/${recordTypeName}`);
      } else {
        alert('Failed to update record');
      }
    } catch (error) {
      console.error('Error updating record:', error);
      alert('Error updating record');
    }
  };

  const handleCancel = () => {
    router.push(`/records/${recordTypeName}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading record...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!recordType || !recordData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Record Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The record you're looking for does not exist.
          </p>
          <Link
            href={`/records/${recordTypeName}`}
            className="text-blue-500 hover:text-blue-600"
          >
            Go back to list
          </Link>
        </div>
      </div>
    );
  }

  if (!recordType.allow_edit) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Cannot Edit Records
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Editing {recordType.display_name} records is not allowed.
          </p>
          <Link
            href={`/records/${recordTypeName}`}
            className="text-blue-500 hover:text-blue-600"
          >
            Go back to list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href={`/records/${recordTypeName}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to {recordType.display_name} List
          </Link>
          
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: recordType.color + '20' }}
            >
              <Edit className="w-6 h-6" style={{ color: recordType.color }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Edit {recordType.display_name}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update the record information below
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Form */}
        <DynamicForm
          recordType={recordType}
          initialData={recordData}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}