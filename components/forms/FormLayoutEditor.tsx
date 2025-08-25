'use client';

import { useState } from 'react';
import { FieldDefinition } from '@/lib/types';
import { 
  Plus, Trash2, Edit2, Move, GripVertical,
  ChevronUp, ChevronDown, Columns2, Columns3, Eye, EyeOff
} from 'lucide-react';

interface FormLayoutEditorProps {
  fields: FieldDefinition[];
  layout: any;
  onChange: (layout: any) => void;
}

export default function FormLayoutEditor({ fields, layout, onChange }: FormLayoutEditorProps) {
  const [draggedField, setDraggedField] = useState<any>(null);
  const [draggedSection, setDraggedSection] = useState<any>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const handleAddSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      name: 'New Section',
      columns: 2,
      fields: []
    };
    onChange({
      ...layout,
      sections: [...layout.sections, newSection]
    });
  };

  const handleUpdateSection = (sectionId: string, updates: any) => {
    onChange({
      ...layout,
      sections: layout.sections.map((s: any) =>
        s.id === sectionId ? { ...s, ...updates } : s
      )
    });
  };

  const handleDeleteSection = (sectionId: string) => {
    onChange({
      ...layout,
      sections: layout.sections.filter((s: any) => s.id !== sectionId)
    });
  };

  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = layout.sections.findIndex((s: any) => s.id === sectionId);
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === layout.sections.length - 1)) {
      return;
    }
    
    const newSections = [...layout.sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    
    onChange({
      ...layout,
      sections: newSections
    });
  };

  const handleFieldDragStart = (e: React.DragEvent, field: FieldDefinition) => {
    setDraggedField(field);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFieldDrop = (e: React.DragEvent, sectionId: string, insertIndex?: number) => {
    e.preventDefault();
    if (!draggedField) return;

    const newLayout = { ...layout };
    
    // Remove field from all sections first
    newLayout.sections = newLayout.sections.map((s: any) => ({
      ...s,
      fields: s.fields.filter((f: any) => f.fieldId !== draggedField.id)
    }));
    
    // Add field to target section
    const targetSection = newLayout.sections.find((s: any) => s.id === sectionId);
    if (targetSection) {
      const newField = {
        fieldId: draggedField.id,
        width: draggedField.field_type === 'textarea' ? 'full' : 'half'
      };
      
      if (insertIndex !== undefined) {
        targetSection.fields.splice(insertIndex, 0, newField);
      } else {
        targetSection.fields.push(newField);
      }
    }
    
    onChange(newLayout);
    setDraggedField(null);
  };

  const handleFieldDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleRemoveField = (sectionId: string, fieldId: string) => {
    onChange({
      ...layout,
      sections: layout.sections.map((s: any) =>
        s.id === sectionId
          ? { ...s, fields: s.fields.filter((f: any) => f.fieldId !== fieldId) }
          : s
      )
    });
  };

  const handleToggleFieldWidth = (sectionId: string, fieldId: string) => {
    onChange({
      ...layout,
      sections: layout.sections.map((s: any) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f: any) =>
                f.fieldId === fieldId
                  ? { ...f, width: f.width === 'full' ? 'half' : 'full' }
                  : f
              )
            }
          : s
      )
    });
  };

  const getUnusedFields = () => {
    const usedFieldIds = new Set();
    layout.sections.forEach((section: any) => {
      section.fields.forEach((field: any) => {
        usedFieldIds.add(field.fieldId);
      });
    });
    return fields.filter(field => !usedFieldIds.has(field.id));
  };

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold dark:text-gray-100">Form Sections</h3>
          <button
            onClick={handleAddSection}
            className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Section
          </button>
        </div>

        {layout.sections.map((section: any, sectionIndex: number) => (
          <div
            key={section.id}
            className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-t-lg">
              {editingSection === section.id ? (
                <input
                  type="text"
                  value={section.name}
                  onChange={(e) => handleUpdateSection(section.id, { name: e.target.value })}
                  onBlur={() => setEditingSection(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingSection(null)}
                  className="flex-1 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <h4 
                    className="font-medium dark:text-gray-100 cursor-pointer"
                    onClick={() => setEditingSection(section.id)}
                  >
                    {section.name || 'Untitled Section'}
                  </h4>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateSection(section.id, { columns: section.columns === 2 ? 3 : 2 })}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  title={`${section.columns} columns`}
                >
                  {section.columns === 3 ? <Columns3 className="w-4 h-4" /> : <Columns2 className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={() => handleMoveSection(section.id, 'up')}
                  disabled={sectionIndex === 0}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleMoveSection(section.id, 'down')}
                  disabled={sectionIndex === layout.sections.length - 1}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDeleteSection(section.id)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              className="min-h-[100px] p-3"
              onDrop={(e) => handleFieldDrop(e, section.id)}
              onDragOver={handleFieldDragOver}
            >
              {section.fields.length === 0 ? (
                <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded">
                  Drag fields here
                </div>
              ) : (
                <div className={`grid grid-cols-${section.columns} gap-3`}>
                  {section.fields.map((fieldLayout: any, fieldIndex: number) => {
                    const field = fields.find(f => f.id === fieldLayout.fieldId);
                    if (!field) return null;
                    
                    return (
                      <div
                        key={field.id}
                        className={`flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded ${
                          fieldLayout.width === 'full' ? `col-span-${section.columns}` : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                          <span className="text-sm dark:text-gray-200">
                            {field.display_name}
                            {field.is_required && <span className="text-red-500 ml-1">*</span>}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleFieldWidth(section.id, field.id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs"
                            title={fieldLayout.width === 'full' ? 'Half width' : 'Full width'}
                          >
                            {fieldLayout.width === 'full' ? '½' : '⅔'}
                          </button>
                          <button
                            onClick={() => handleRemoveField(section.id, field.id)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="w-64">
        <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Available Fields</h3>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          {getUnusedFields().length === 0 ? (
            <div className="text-center text-gray-400 py-4">
              All fields are in use
            </div>
          ) : (
            <div className="space-y-2">
              {getUnusedFields().map(field => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={(e) => handleFieldDragStart(e, field)}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded cursor-move hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="text-sm dark:text-gray-200">
                    {field.display_name}
                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs text-gray-600 dark:text-gray-400">
          <p className="font-semibold mb-1">Tips:</p>
          <ul className="space-y-1">
            <li>• Drag fields to add them to sections</li>
            <li>• Click section names to edit</li>
            <li>• Use column buttons to change layout</li>
            <li>• Click ½ to toggle field width</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}