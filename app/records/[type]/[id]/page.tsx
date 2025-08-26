'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { RecordType, FieldDefinition } from '@/lib/types';
import { 
  ChevronLeft, Edit2, Trash2, Eye, Calendar,
  User, Mail, Phone, FileText
} from 'lucide-react';

export default function ViewRecordPage() {
  const params = useParams();
  const router = useRouter();
  const recordTypeName = params.type as string;
  const recordId = params.id as string;
  
  const [recordType, setRecordType] = useState<RecordType | null>(null);
  const [recordData, setRecordData] = useState<any>(null);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [relatedData, setRelatedData] = useState<{ [key: string]: any }>({});
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
      
      // Fetch field definitions
      const fieldsResponse = await fetch(`/api/record-types/${currentType.id}/fields`);
      if (fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json();
        setFields(fieldsData);
        
        // Fetch related data for relation and multiselect fields
        for (const field of fieldsData) {
          if (field.field_type === 'relation' && data[field.field_name]) {
            let relatedType = null;
            if (field.options) {
              try {
                const options = JSON.parse(field.options);
                relatedType = options.record_type;
              } catch (e) {
                // Fallback to field name detection
                if (field.field_name.includes('patient')) relatedType = 'patient';
                if (field.field_name.includes('provider') || field.field_name.includes('manager')) relatedType = 'employee';
              }
            }
            
            if (relatedType) {
              const relatedResponse = await fetch(`/api/records/${relatedType}/${data[field.field_name]}`);
              if (relatedResponse.ok) {
                const relatedRecord = await relatedResponse.json();
                setRelatedData(prev => ({ ...prev, [field.field_name]: relatedRecord }));
              }
            }
          } else if (field.field_type === 'multiselect' && field.options && field.options.includes('record_type')) {
            // Fetch all records for multiselect relation fields
            let relatedType = null;
            try {
              const options = JSON.parse(field.options);
              relatedType = options.record_type;
            } catch (e) {
              // Fallback to field name detection
              if (field.field_name.includes('attendees') || field.field_name.includes('participants')) relatedType = 'employee';
            }
            
            if (relatedType) {
              const relatedResponse = await fetch(`/api/records/${relatedType}`);
              if (relatedResponse.ok) {
                const relatedRecords = await relatedResponse.json();
                setRelatedData(prev => ({ ...prev, [field.field_name]: relatedRecords }));
              }
            }
          }
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!recordType?.allow_delete) {
      alert('This record type cannot be deleted');
      return;
    }

    if (!confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      const response = await fetch(`/api/records/${recordTypeName}/${recordId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push(`/records/${recordTypeName}`);
      } else {
        alert('Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Error deleting record');
    }
  };

  const formatFieldValue = (field: FieldDefinition, value: any): string => {
    if (value === null || value === undefined) return '-';
    
    switch (field.field_type) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'datetime':
        return new Date(value).toLocaleString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'relation':
        const related = relatedData[field.field_name];
        if (related) {
          if (related.first_name && related.last_name) {
            return `${related.first_name} ${related.last_name}`;
          }
          return related.name || related.title || related.id;
        }
        return value;
      case 'multiselect':
        if (Array.isArray(value)) {
          // Check if this is a relation multiselect (employees, etc.)
          const isRelation = field.options && field.options.includes('record_type');
          
          if (isRelation) {
            // Try to get names from relatedData
            const names = value.map(id => {
              const records = relatedData[field.field_name];
              if (Array.isArray(records)) {
                const record = records.find((r: any) => r.id === id);
                if (record) {
                  if (record.first_name && record.last_name) {
                    return `${record.first_name} ${record.last_name}`;
                  }
                  return record.name || record.title || id;
                }
              }
              return id;
            });
            return names.join(', ');
          }
          
          return value.join(', ');
        }
        return value;
      default:
        return String(value);
    }
  };

  const getRecordTitle = () => {
    if (!recordData) return '';
    if (recordData.title) return recordData.title;
    if (recordData.name) return recordData.name;
    if (recordData.first_name && recordData.last_name) {
      return `${recordData.first_name} ${recordData.last_name}`;
    }
    return `${recordType?.display_name} #${recordId}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading...</div>
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
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: recordType.color + '20' }}
              >
                <Eye className="w-6 h-6" style={{ color: recordType.color }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {getRecordTitle()}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {recordType.display_name} • ID: {recordId}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {recordType.allow_edit && (
                <Link
                  href={`/records/${recordTypeName}/${recordId}/edit`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Link>
              )}
              
              {recordType.allow_delete && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Record Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Record Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map(field => (
                <div 
                  key={field.id}
                  className={field.field_type === 'textarea' ? 'md:col-span-2' : ''}
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {field.display_name}
                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <div className="text-gray-900 dark:text-gray-100">
                    {field.field_type === 'textarea' ? (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg whitespace-pre-wrap">
                        {formatFieldValue(field, recordData[field.field_name])}
                      </div>
                    ) : field.field_type === 'multiselect' && Array.isArray(recordData[field.field_name]) ? (
                      <div className="flex flex-wrap gap-2 py-2">
                        {(() => {
                          const value = recordData[field.field_name];
                          const isRelation = field.options && field.options.includes('record_type');
                          
                          if (isRelation) {
                            return value.map((id: string) => {
                              const records = relatedData[field.field_name];
                              let label = id;
                              if (Array.isArray(records)) {
                                const record = records.find((r: any) => r.id === id);
                                if (record) {
                                  label = record.first_name && record.last_name 
                                    ? `${record.first_name} ${record.last_name}`
                                    : record.name || record.title || id;
                                }
                              }
                              return (
                                <span
                                  key={id}
                                  className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                                >
                                  {label}
                                </span>
                              );
                            });
                          } else {
                            return value.map((item: string) => (
                              <span
                                key={item}
                                className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                              >
                                {item}
                              </span>
                            ));
                          }
                        })()}
                      </div>
                    ) : (
                      <div className="py-2">
                        {formatFieldValue(field, recordData[field.field_name])}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Metadata */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div>
                Created: {new Date(recordData.created_at).toLocaleString()}
              </div>
              {recordData.updated_at && (
                <div>
                  Last Updated: {new Date(recordData.updated_at).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}