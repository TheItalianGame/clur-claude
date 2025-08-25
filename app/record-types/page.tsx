'use client';

import { useState, useEffect } from 'react';
import { RecordType, RecordCategory } from '@/lib/types';
import { 
  Plus, Edit2, Trash2, Settings, FileText, Calendar,
  Shield, Lock, Unlock, Eye, EyeOff, Database
} from 'lucide-react';
import Link from 'next/link';

export default function RecordTypesPage() {
  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
  const [categories, setCategories] = useState<RecordCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [typesRes, categoriesRes] = await Promise.all([
        fetch('/api/record-types'),
        fetch('/api/categories')
      ]);
      
      const typesData = await typesRes.json();
      const categoriesData = await categoriesRes.json();
      
      setRecordTypes(typesData);
      setCategories(categoriesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (recordType: RecordType) => {
    if (recordType.is_system) {
      alert('System record types cannot be deleted');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${recordType.display_name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/record-types/${recordType.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchData();
      } else {
        alert('Failed to delete record type');
      }
    } catch (error) {
      console.error('Error deleting record type:', error);
      alert('Error deleting record type');
    }
  };

  const filteredRecordTypes = selectedCategory === 'all'
    ? recordTypes
    : recordTypes.filter(rt => rt.category_id === selectedCategory);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading record types...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <Database className="w-8 h-8" />
                Record Types Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Configure and manage different types of records in your system
              </p>
            </div>
            
            <Link
              href="/record-types/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Record Type
            </Link>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All ({recordTypes.length})
            </button>
            {categories.map(category => {
              const count = recordTypes.filter(rt => rt.category_id === category.id).length;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === category.id ? category.color : undefined
                  }}
                >
                  {category.display_name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Record Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecordTypes.map(recordType => (
            <div
              key={recordType.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border-l-4"
              style={{ borderLeftColor: recordType.color }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {recordType.display_name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {recordType.name}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {recordType.is_system && (
                    <Shield className="w-4 h-4 text-blue-500" title="System Record" />
                  )}
                  {recordType.show_in_calendar && (
                    <Calendar className="w-4 h-4 text-green-500" title="Shows in Calendar" />
                  )}
                </div>
              </div>

              {recordType.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {recordType.description}
                </p>
              )}

              {/* Flags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {recordType.requires_patient && (
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded">
                    Requires Patient
                  </span>
                )}
                {recordType.requires_visit && (
                  <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs rounded">
                    Requires Visit
                  </span>
                )}
                {recordType.show_in_sidebar && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded">
                    <Eye className="w-3 h-3 inline" /> Sidebar
                  </span>
                )}
                {!recordType.allow_delete && (
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs rounded">
                    <Lock className="w-3 h-3 inline" /> Protected
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href={`/forms?record_type=${recordType.id}`}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  Forms
                </Link>
                
                <Link
                  href={`/record-types/${recordType.id}/fields`}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  <Settings className="w-3 h-3" />
                  Fields
                </Link>
                
                {!recordType.is_system && (
                  <>
                    <Link
                      href={`/record-types/${recordType.id}/edit`}
                      className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    
                    <button
                      onClick={() => handleDelete(recordType)}
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

        {filteredRecordTypes.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <Database className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No record types found in this category
            </p>
          </div>
        )}
      </div>
    </div>
  );
}