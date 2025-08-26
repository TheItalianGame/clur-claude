'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Check, Minus, Filter } from 'lucide-react';

interface CalendarFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
}

export interface FilterState {
  categories: { [key: string]: boolean };
  recordTypes: { [key: string]: boolean };
  fields: { [key: string]: boolean };
}

interface Category {
  id: string;
  name: string;
  display_name: string;
  color: string;
  icon?: string;
}

interface RecordType {
  id: string;
  name: string;
  display_name: string;
  category_id: string;
  color: string;
  icon?: string;
}

interface Field {
  id: string;
  record_type_id: string;
  field_name: string;
  display_name: string;
  field_type: string;
  show_on_calendar: boolean;
}

export default function CalendarFilters({ onFiltersChange }: CalendarFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    categories: {},
    recordTypes: {},
    fields: {}
  });
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFilterData();
  }, []);

  // Only call onFiltersChange after initial data is loaded
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    if (hasInitialized) {
      onFiltersChange(filters);
      // Save filter preferences
      localStorage.setItem('calendar-filter-preferences', JSON.stringify(filters));
    }
  }, [filters, onFiltersChange, hasInitialized]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  const fetchFilterData = async () => {
    try {
      // Check cache first for faster loading
      const cacheKey = 'calendar-filter-data';
      const cached = sessionStorage.getItem(cacheKey);
      let catData, rtData, flatFields;
      
      if (cached) {
        // Use cached data if available
        const cachedData = JSON.parse(cached);
        if (cachedData.timestamp && Date.now() - cachedData.timestamp < 5 * 60 * 1000) { // 5 minute cache
          catData = cachedData.categories;
          rtData = cachedData.recordTypes;
          flatFields = cachedData.fields;
          setCategories(catData);
          setRecordTypes(rtData);
          setFields(flatFields);
        }
      }
      
      if (!catData || !rtData || !flatFields) {
        // Fetch all data in parallel for better performance
        const [catResponse, rtResponse] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/record-types')
        ]);
        
        [catData, rtData] = await Promise.all([
          catResponse.json(),
          rtResponse.json()
        ]);
        
        setCategories(catData);
        setRecordTypes(rtData);

        // Fetch fields for all record types in parallel
        const fieldPromises = rtData.map((rt: RecordType) => 
          fetch(`/api/record-types/${rt.id}/fields`).then(res => res.json())
        );
        const allFields = await Promise.all(fieldPromises);
        flatFields = allFields.flat().filter((f: Field) => 
          f.field_type === 'date' || f.field_type === 'datetime'
        );
        setFields(flatFields);
        
        // Cache the data
        sessionStorage.setItem(cacheKey, JSON.stringify({
          categories: catData,
          recordTypes: rtData,
          fields: flatFields,
          timestamp: Date.now()
        }));
      }

      // Try to load saved filter preferences
      const savedFilters = localStorage.getItem('calendar-filter-preferences');
      let initialFilters: FilterState;
      
      if (savedFilters) {
        // Use saved filter preferences
        initialFilters = JSON.parse(savedFilters);
        
        // Validate that saved filters are still valid (fields might have changed)
        const validFieldKeys = new Set(flatFields.map(f => `${f.record_type_id}-${f.field_name}`));
        Object.keys(initialFilters.fields).forEach(key => {
          if (!validFieldKeys.has(key)) {
            delete initialFilters.fields[key];
          }
        });
      } else {
        // Initialize default filters - only fields with show_on_calendar are checked by default
        initialFilters = {
          categories: {},
          recordTypes: {},
          fields: {}
        };
        
        // First, check which fields have show_on_calendar
        const fieldsToShow = new Set<string>();
        flatFields.forEach((field: Field) => {
          if (field.show_on_calendar) {
            fieldsToShow.add(`${field.record_type_id}-${field.field_name}`);
            initialFilters.fields[`${field.record_type_id}-${field.field_name}`] = true;
          } else {
            // Explicitly set to false for fields without the flag
            initialFilters.fields[`${field.record_type_id}-${field.field_name}`] = false;
          }
        });
        
        // Set record types based on whether they have any checked fields
        rtData.forEach((rt: RecordType) => {
          const rtFields = flatFields.filter(f => f.record_type_id === rt.id);
          const hasCheckedFields = rtFields.some(f => 
            fieldsToShow.has(`${f.record_type_id}-${f.field_name}`)
          );
          initialFilters.recordTypes[rt.id] = hasCheckedFields;
        });
        
        // Set categories based on whether they have any checked record types
        catData.forEach((cat: Category) => {
          const catRTs = rtData.filter(rt => rt.category_id === cat.id);
          const hasCheckedRTs = catRTs.some(rt => initialFilters.recordTypes[rt.id]);
          initialFilters.categories[cat.id] = hasCheckedRTs;
        });
      }
      
      setFilters(initialFilters);
      setHasInitialized(true);
      onFiltersChange(initialFilters); // Send initial filters immediately
      setLoading(false);
    } catch (error) {
      console.error('Error fetching filter data:', error);
      setLoading(false);
      // Set empty filters on error so calendar can still work
      const emptyFilters: FilterState = { categories: {}, recordTypes: {}, fields: {} };
      setFilters(emptyFilters);
      setHasInitialized(true);
      onFiltersChange(emptyFilters);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newValue = !filters.categories[categoryId];
    const newFilters = { ...filters };
    
    // Update category
    newFilters.categories[categoryId] = newValue;
    
    // Update all record types in this category
    const categoryRecordTypes = recordTypes.filter(rt => rt.category_id === categoryId);
    categoryRecordTypes.forEach(rt => {
      newFilters.recordTypes[rt.id] = newValue;
      
      // Update all fields for these record types
      const rtFields = fields.filter(f => f.record_type_id === rt.id);
      rtFields.forEach(field => {
        newFilters.fields[`${field.record_type_id}-${field.field_name}`] = newValue;
      });
    });
    
    setFilters(newFilters);
  };

  const toggleRecordType = (recordTypeId: string) => {
    const newValue = !filters.recordTypes[recordTypeId];
    const newFilters = { ...filters };
    
    // Update record type
    newFilters.recordTypes[recordTypeId] = newValue;
    
    // Update all fields for this record type
    const rtFields = fields.filter(f => f.record_type_id === recordTypeId);
    rtFields.forEach(field => {
      newFilters.fields[`${field.record_type_id}-${field.field_name}`] = newValue;
    });
    
    // Update parent category state based on children
    const recordType = recordTypes.find(rt => rt.id === recordTypeId);
    if (recordType) {
      const siblingRTs = recordTypes.filter(rt => rt.category_id === recordType.category_id);
      const allChecked = siblingRTs.every(rt => 
        rt.id === recordTypeId ? newValue : filters.recordTypes[rt.id]
      );
      const someChecked = siblingRTs.some(rt => 
        rt.id === recordTypeId ? newValue : filters.recordTypes[rt.id]
      );
      
      if (allChecked) {
        newFilters.categories[recordType.category_id] = true;
      } else if (!someChecked) {
        newFilters.categories[recordType.category_id] = false;
      }
    }
    
    setFilters(newFilters);
  };

  const toggleField = (recordTypeId: string, fieldName: string) => {
    const fieldKey = `${recordTypeId}-${fieldName}`;
    const newValue = !filters.fields[fieldKey];
    const newFilters = { ...filters };
    
    // Update field
    newFilters.fields[fieldKey] = newValue;
    
    // Update parent record type state based on children
    const rtFields = fields.filter(f => f.record_type_id === recordTypeId);
    const allChecked = rtFields.every(f => 
      `${f.record_type_id}-${f.field_name}` === fieldKey 
        ? newValue 
        : filters.fields[`${f.record_type_id}-${f.field_name}`]
    );
    const someChecked = rtFields.some(f => 
      `${f.record_type_id}-${f.field_name}` === fieldKey 
        ? newValue 
        : filters.fields[`${f.record_type_id}-${f.field_name}`]
    );
    
    if (allChecked) {
      newFilters.recordTypes[recordTypeId] = true;
    } else if (!someChecked) {
      newFilters.recordTypes[recordTypeId] = false;
    }
    
    // Update grandparent category state
    const recordType = recordTypes.find(rt => rt.id === recordTypeId);
    if (recordType) {
      const siblingRTs = recordTypes.filter(rt => rt.category_id === recordType.category_id);
      const allRTsChecked = siblingRTs.every(rt => newFilters.recordTypes[rt.id]);
      const someRTsChecked = siblingRTs.some(rt => newFilters.recordTypes[rt.id]);
      
      if (allRTsChecked) {
        newFilters.categories[recordType.category_id] = true;
      } else if (!someRTsChecked) {
        newFilters.categories[recordType.category_id] = false;
      }
    }
    
    setFilters(newFilters);
  };

  const getCategoryCheckState = (categoryId: string) => {
    const categoryRTs = recordTypes.filter(rt => rt.category_id === categoryId);
    const checkedCount = categoryRTs.filter(rt => filters.recordTypes[rt.id]).length;
    
    if (checkedCount === 0) return 'unchecked';
    if (checkedCount === categoryRTs.length) return 'checked';
    return 'indeterminate';
  };

  const getRecordTypeCheckState = (recordTypeId: string) => {
    const rtFields = fields.filter(f => f.record_type_id === recordTypeId);
    const checkedCount = rtFields.filter(f => 
      filters.fields[`${f.record_type_id}-${f.field_name}`]
    ).length;
    
    if (checkedCount === 0) return 'unchecked';
    if (checkedCount === rtFields.length) return 'checked';
    return 'indeterminate';
  };

  const renderCheckbox = (state: 'checked' | 'unchecked' | 'indeterminate') => {
    return (
      <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${
        state === 'checked' 
          ? 'bg-blue-500 border-blue-500' 
          : state === 'indeterminate'
          ? 'bg-blue-200 dark:bg-blue-800 border-blue-500'
          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
      }`}>
        {state === 'checked' && <Check className="w-3 h-3 text-white" />}
        {state === 'indeterminate' && <Minus className="w-3 h-3 text-blue-700 dark:text-blue-300" />}
      </div>
    );
  };

  if (loading) {
    return <div className="p-4 text-gray-500 dark:text-gray-400">Loading filters...</div>;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="px-3 py-2 rounded-lg flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-100 transition-colors text-sm"
      >
        <Filter className="w-4 h-4" />
        <span className="hidden sm:inline">Filters</span>
      </button>

      {showFilters && (
        <div className="absolute top-full right-0 mt-2 w-72 max-h-[450px] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Filter Calendar Events</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Select which events to show on the calendar
            </p>
          </div>

          <div className="p-2">
            {categories.map(category => {
              const categoryRTs = recordTypes.filter(rt => rt.category_id === category.id);
              const hasDateFields = categoryRTs.some(rt => 
                fields.some(f => f.record_type_id === rt.id)
              );
              
              if (!hasDateFields) return null;
              
              return (
                <div key={category.id} className="mb-2">
                  <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                    <button
                      onClick={() => setExpanded({ ...expanded, [category.id]: !expanded[category.id] })}
                      className="p-0.5"
                    >
                      {expanded[category.id] 
                        ? <ChevronDown className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        : <ChevronRight className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                      }
                    </button>
                    
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="flex items-center gap-2 flex-1"
                    >
                      {renderCheckbox(getCategoryCheckState(category.id))}
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {category.display_name}
                      </span>
                    </button>
                  </div>

                  {expanded[category.id] && (
                    <div className="ml-6">
                      {categoryRTs.map(recordType => {
                        const rtFields = fields.filter(f => f.record_type_id === recordType.id);
                        
                        if (rtFields.length === 0) return null;
                        
                        return (
                          <div key={recordType.id} className="mb-1">
                            <div className="flex items-center gap-2 p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                              <button
                                onClick={() => setExpanded({ 
                                  ...expanded, 
                                  [`${category.id}-${recordType.id}`]: !expanded[`${category.id}-${recordType.id}`] 
                                })}
                                className="p-0.5"
                              >
                                {expanded[`${category.id}-${recordType.id}`]
                                  ? <ChevronDown className="w-3 h-3 text-gray-400" />
                                  : <ChevronRight className="w-3 h-3 text-gray-400" />
                                }
                              </button>
                              
                              <button
                                onClick={() => toggleRecordType(recordType.id)}
                                className="flex items-center gap-2 flex-1"
                              >
                                {renderCheckbox(getRecordTypeCheckState(recordType.id))}
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {recordType.display_name}
                                </span>
                              </button>
                            </div>

                            {expanded[`${category.id}-${recordType.id}`] && (
                              <div className="ml-6">
                                {rtFields.map(field => (
                                  <button
                                    key={field.id}
                                    onClick={() => toggleField(recordType.id, field.field_name)}
                                    className="flex items-center gap-2 p-1 w-full hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                                  >
                                    {renderCheckbox(
                                      filters.fields[`${field.record_type_id}-${field.field_name}`] 
                                        ? 'checked' 
                                        : 'unchecked'
                                    )}
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {field.display_name}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const newFilters: FilterState = {
                    categories: {},
                    recordTypes: {},
                    fields: {}
                  };
                  
                  // Select all fields (not just those with show_on_calendar)
                  fields.forEach(f => {
                    newFilters.fields[`${f.record_type_id}-${f.field_name}`] = true;
                  });
                  
                  // Select all record types and categories
                  recordTypes.forEach(rt => newFilters.recordTypes[rt.id] = true);
                  categories.forEach(cat => newFilters.categories[cat.id] = true);
                  
                  setFilters(newFilters);
                }}
                className="flex-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => {
                  setFilters({
                    categories: {},
                    recordTypes: {},
                    fields: {}
                  });
                }}
                className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Clear All
              </button>
            </div>
            <button
              onClick={() => {
                // Reset to default (show_on_calendar) selections
                const newFilters: FilterState = {
                  categories: {},
                  recordTypes: {},
                  fields: {}
                };
                
                const fieldsToShow = new Set<string>();
                fields.forEach((field) => {
                  if (field.show_on_calendar) {
                    fieldsToShow.add(`${field.record_type_id}-${field.field_name}`);
                    newFilters.fields[`${field.record_type_id}-${field.field_name}`] = true;
                  } else {
                    newFilters.fields[`${field.record_type_id}-${field.field_name}`] = false;
                  }
                });
                
                recordTypes.forEach((rt) => {
                  const rtFields = fields.filter(f => f.record_type_id === rt.id);
                  const hasCheckedFields = rtFields.some(f => 
                    fieldsToShow.has(`${f.record_type_id}-${f.field_name}`)
                  );
                  newFilters.recordTypes[rt.id] = hasCheckedFields;
                });
                
                categories.forEach((cat) => {
                  const catRTs = recordTypes.filter(rt => rt.category_id === cat.id);
                  const hasCheckedRTs = catRTs.some(rt => newFilters.recordTypes[rt.id]);
                  newFilters.categories[cat.id] = hasCheckedRTs;
                });
                
                setFilters(newFilters);
              }}
              className="w-full px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}