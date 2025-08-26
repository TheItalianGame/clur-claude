'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RecordCategory, RecordType } from '@/lib/types';
import * as Icons from 'lucide-react';
import { 
  Calendar, Users, FileText, Settings, Plus, List,
  ChevronDown, ChevronRight, Home, LayoutGrid
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<RecordCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      
      // Ensure data is an array
      const categoriesArray = Array.isArray(data) ? data : [];
      setCategories(categoriesArray);
      
      // Auto-expand categories with items
      if (categoriesArray.length > 0) {
        const expanded = new Set(
          categoriesArray
            .filter((c: any) => c.record_types?.length > 0)
            .map((c: any) => c.id)
        );
        setExpandedCategories(expanded);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return FileText;
    const Icon = (Icons as any)[iconName];
    return Icon || FileText;
  };

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen overflow-y-auto" style={{ position: 'relative', zIndex: 5 }}>
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          CLUR
        </h1>
        
        <nav className="space-y-1">
          {/* Main Navigation */}
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive('/') 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold border-l-2 border-blue-500' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-gray-100'
            }`}
          >
            <Home className="w-5 h-5" />
            Dashboard
          </Link>
          
          <Link
            href="/calendar"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive('/calendar')
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold border-l-2 border-blue-500'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-gray-100'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Calendar
          </Link>

          <div className="pt-4 pb-2">
            <div className="border-t border-gray-200 dark:border-gray-700"></div>
          </div>

          {/* Categories with Record Types */}
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
          ) : (
            categories.map((category: any) => (
              <div key={category.id} className="mb-2">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {React.createElement(getIcon(category.icon), { 
                      className: "w-4 h-4",
                      style: { color: category.color }
                    })}
                    <span>{category.display_name}</span>
                    {category.record_type_count > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({category.record_type_count})
                      </span>
                    )}
                  </div>
                  {category.record_types?.length > 0 && (
                    expandedCategories.has(category.id) 
                      ? <ChevronDown className="w-4 h-4" />
                      : <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                
                {expandedCategories.has(category.id) && category.record_types?.length > 0 && (
                  <div className="ml-6 mt-1 space-y-1">
                    {category.record_types.map((recordType: RecordType) => (
                      <div key={recordType.id} className="relative group">
                        <Link
                          href={`/records/${recordType.name}`}
                          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            isActive(`/records/${recordType.name}`)
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold'
                              : 'hover:bg-blue-50/50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-blue-600'
                          }`}
                        >
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: recordType.color }}
                          />
                          <span className="flex-1">{recordType.display_name}</span>
                        </Link>
                        
                        {/* Quick Actions Menu */}
                        <div className="absolute right-2 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          {recordType.allow_create && (
                            <Link
                              href={`/records/${recordType.name}/new`}
                              className="p-1 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-gray-200 rounded"
                              title={`New ${recordType.display_name}`}
                            >
                              <Plus className="w-3 h-3" />
                            </Link>
                          )}
                          <Link
                            href={`/records/${recordType.name}`}
                            className="p-1 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-gray-200 rounded"
                            title={`List ${recordType.display_name}`}
                          >
                            <List className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          <div className="pt-4 pb-2">
            <div className="border-t border-gray-200 dark:border-gray-700"></div>
          </div>

          {/* Administration */}
          <Link
            href="/record-types"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive('/record-types')
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold border-l-2 border-blue-500'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-gray-100'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            Record Types
          </Link>
          
          <Link
            href="/forms"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive('/forms')
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold border-l-2 border-blue-500'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-gray-100'
            }`}
          >
            <FileText className="w-5 h-5" />
            Forms
          </Link>
          
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive('/settings')
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold border-l-2 border-blue-500'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-gray-100'
            }`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </nav>
      </div>
    </aside>
  );
}

const React = { createElement: (component: any, props: any) => {
  const Component = component;
  return <Component {...props} />;
}};