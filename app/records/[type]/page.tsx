'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { RecordType } from '@/lib/types';
import { 
  Plus, Edit2, Trash2, Search, Filter, Eye,
  Calendar, ChevronLeft, FileText, List
} from 'lucide-react';

export default function RecordListPage() {
  const params = useParams();
  const recordTypeName = params.type as string;
  
  const [recordType, setRecordType] = useState<RecordType | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRecordTypeAndData();
  }, [recordTypeName]);

  const fetchRecordTypeAndData = async () => {
    try {
      // First get all record types to find the one we need
      const typesResponse = await fetch('/api/record-types');
      const types = await typesResponse.json();
      
      const currentType = types.find((t: RecordType) => t.name === recordTypeName);
      if (!currentType) {
        setLoading(false);
        return;
      }
      
      setRecordType(currentType);
      
      // Then fetch records for this type
      const recordsResponse = await fetch(`/api/records/${recordTypeName}`);
      if (recordsResponse.ok) {
        const data = await recordsResponse.json();
        setRecords(data);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (recordId: string) => {
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
        fetchRecordTypeAndData();
      } else {
        alert('Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Error deleting record');
    }
  };

  const getRecordTitle = (record: any) => {
    // Try common title fields
    if (record.title) return record.title;
    if (record.name) return record.name;
    if (record.first_name && record.last_name) {
      return `${record.first_name} ${record.last_name}`;
    }
    if (record.display_name) return record.display_name;
    if (record.visit_type) return record.visit_type;
    return `Record #${record.id}`;
  };

  const getRecordSubtitle = (record: any) => {
    // Try to show relevant subtitle based on record type
    if (record.email) return record.email;
    if (record.visit_date) return new Date(record.visit_date).toLocaleDateString();
    if (record.start_time) return new Date(record.start_time).toLocaleDateString();
    if (record.created_at) return `Created: ${new Date(record.created_at).toLocaleDateString()}`;
    return '';
  };

  const filteredRecords = records.filter(record => {
    const title = getRecordTitle(record).toLowerCase();
    const subtitle = getRecordSubtitle(record).toLowerCase();
    return title.includes(searchTerm.toLowerCase()) || 
           subtitle.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading records...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!recordType) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Record Type Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The record type "{recordTypeName}" does not exist.
          </p>
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-600"
          >
            Go back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <Link href="/" className="hover:text-gray-900 dark:hover:text-gray-100">
              Home
            </Link>
            <span>/</span>
            <span>{recordType.display_name}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: recordType.color + '20' }}
              >
                <div 
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: recordType.color }}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {recordType.display_name}
                </h1>
                {recordType.description && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {recordType.description}
                  </p>
                )}
              </div>
            </div>
            
            {recordType.allow_create && (
              <Link
                href={`/records/${recordTypeName}/new`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New {recordType.display_name}
              </Link>
            )}
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${recordType.display_name.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
              <Filter className="w-4 h-4" />
              <span className="text-gray-700 dark:text-gray-200">Filter</span>
            </button>
          </div>
        </div>

        {/* Records List */}
        {filteredRecords.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <List className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No {recordType.display_name} Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm 
                ? `No records match "${searchTerm}"`
                : `Get started by creating your first ${recordType.display_name.toLowerCase()}.`
              }
            </p>
            {recordType.allow_create && !searchTerm && (
              <Link
                href={`/records/${recordTypeName}/new`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create First {recordType.display_name}
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name / Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {getRecordTitle(record)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {record.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {getRecordSubtitle(record)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(record.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/records/${recordTypeName}/${record.id}`}
                          className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        
                        {recordType.allow_edit && (
                          <Link
                            href={`/records/${recordTypeName}/${record.id}/edit`}
                            className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        )}
                        
                        {recordType.allow_delete && (
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredRecords.length} of {records.length} records
        </div>
      </div>
    </div>
  );
}