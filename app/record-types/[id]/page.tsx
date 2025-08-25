'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Plus } from 'lucide-react';
import { RecordType, FieldDefinition } from '@/lib/types';

export default function RecordTypeEditPage() {
  const params = useParams();
  const router = useRouter();
  const recordTypeId = params.id as string;
  
  const [recordType, setRecordType] = useState<RecordType | null>(null);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecordType();
    fetchFields();
  }, [recordTypeId]);

  const fetchRecordType = async () => {
    try {
      const response = await fetch(`/api/record-types`);
      const types = await response.json();
      const type = types.find((t: RecordType) => t.id === recordTypeId);
      if (type) {
        setRecordType(type);
      }
    } catch (error) {
      console.error('Error fetching record type:', error);
    }
  };

  const fetchFields = async () => {
    try {
      const response = await fetch(`/api/record-types/${recordTypeId}/fields`);
      const data = await response.json();
      // Remove cf_ prefix from field names for display in custom record types
      const processedFields = data.map((field: FieldDefinition) => ({
        ...field,
        field_name: field.field_name.startsWith('cf_') 
          ? field.field_name.substring(3) 
          : field.field_name
      }));
      setFields(processedFields);
    } catch (error) {
      console.error('Error fetching fields:', error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="p-6">
        <div className="text-xl">Loading...</div>
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
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {recordType.display_name}
            </h1>
            <div 
              className="w-6 h-6 rounded"
              style={{ backgroundColor: recordType.color }}
            />
            {recordType.is_system && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                System
              </span>
            )}
          </div>
          <Link
            href={`/record-types/${recordTypeId}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Edit className="w-4 h-4" />
            Edit Record Type
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Internal Name:</span>
            <span className="ml-2 font-mono">{recordType.name}</span>
          </div>
          <div>
            <span className="text-gray-500">ID:</span>
            <span className="ml-2 font-mono">{recordType.id}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Fields</h2>
          <Link
            href={`/record-types/${recordTypeId}/fields`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Edit className="w-4 h-4" />
            Manage Fields
          </Link>
        </div>

        <div className="space-y-2">
          {fields.length === 0 ? (
            <p className="text-gray-500">No fields defined</p>
          ) : (
            fields.map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{field.display_name}</div>
                  <div className="text-sm text-gray-500">
                    {field.field_name} • {field.field_type}
                    {field.is_required && ' • Required'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}