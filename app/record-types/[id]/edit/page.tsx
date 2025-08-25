'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, Trash2 } from 'lucide-react';
import { RecordType } from '@/lib/types';

export default function EditRecordTypePage() {
  const params = useParams();
  const router = useRouter();
  const recordTypeId = params.id as string;
  
  const [recordType, setRecordType] = useState<RecordType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [color, setColor] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [icon, setIcon] = useState('');
  const [showInSidebar, setShowInSidebar] = useState(true);
  const [orderIndex, setOrderIndex] = useState(0);

  useEffect(() => {
    fetchRecordType();
    fetchCategories();
  }, [recordTypeId]);

  const fetchRecordType = async () => {
    try {
      const response = await fetch(`/api/record-types/${recordTypeId}`);
      if (response.ok) {
        const type = await response.json();
        setRecordType(type);
        setDisplayName(type.display_name);
        setColor(type.color);
        setCategoryId(type.category_id || 'cat-custom');
        setIcon(type.icon || 'FileText');
        setShowInSidebar(type.show_in_sidebar !== false);
        setOrderIndex(type.order_index || 0);
      } else {
        console.error('Record type not found');
      }
    } catch (error) {
      console.error('Error fetching record type:', error);
    } finally {
      setLoading(false);
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: any = {
        display_name: displayName,
        color: color,
        category_id: categoryId,
        icon: icon,
        show_in_sidebar: showInSidebar ? 1 : 0,
        order_index: orderIndex
      };

      const response = await fetch(`/api/record-types/${recordTypeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        router.push(`/record-types/${recordTypeId}`);
      } else {
        alert('Failed to update record type');
      }
    } catch (error) {
      console.error('Error updating record type:', error);
      alert('Error updating record type');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${displayName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/record-types/${recordTypeId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        router.push('/record-types');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete record type');
      }
    } catch (error) {
      console.error('Error deleting record type:', error);
      alert('Error deleting record type');
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

      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Record Type
          </h1>
          {recordType.is_system && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">
              System Record Type
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={recordType.is_system}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internal Name
            </label>
            <input
              type="text"
              value={recordType.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Cannot be changed after creation</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={recordType.is_system}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.display_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#000000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon Name
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., FileText, Users, Calendar"
            />
            <p className="text-xs text-gray-500 mt-1">Lucide icon name</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Order
            </label>
            <input
              type="number"
              value={orderIndex}
              onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showInSidebar"
              checked={showInSidebar}
              onChange={(e) => setShowInSidebar(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="showInSidebar" className="text-sm font-medium text-gray-700">
              Show in sidebar
            </label>
          </div>
        </div>

        <div className="flex justify-between mt-6 pt-6 border-t">
          <div>
            {!recordType.is_system && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 inline mr-2" />
                Delete Record Type
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}