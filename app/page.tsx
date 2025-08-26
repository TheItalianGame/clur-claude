'use client';

import { useState, useEffect } from 'react';
import CalendarView from '@/components/calendar/CalendarView';
import RecordTypeBuilder from '@/components/records/RecordTypeBuilder';
import DynamicForm from '@/components/forms/DynamicForm';
import { RecordType, CalendarEvent } from '@/lib/types';
import { Calendar, Plus, Settings, Users, FileText, Database, Menu, X } from 'lucide-react';

export default function Home() {
  const [view, setView] = useState<'calendar' | 'records' | 'new-record' | 'new-type'>('calendar');
  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
  const [selectedRecordType, setSelectedRecordType] = useState<RecordType | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (selectedRecordType && view === 'records') {
      fetchRecords();
    }
  }, [selectedRecordType, view]);

  const initializeApp = async () => {
    // Initialize database
    await fetch('/api/init');
    
    // Fetch record types
    const response = await fetch('/api/record-types');
    const types = await response.json();
    setRecordTypes(types);
    
    if (types.length > 0) {
      setSelectedRecordType(types[0]);
    }
    
    setInitialized(true);
  };

  const fetchRecords = async () => {
    if (!selectedRecordType) return;
    
    const response = await fetch(`/api/records/${selectedRecordType.id}`);
    const data = await response.json();
    setRecords(data);
  };

  const handleEventClick = (event: CalendarEvent) => {
    // Find the record type
    const recordType = recordTypes.find(rt => rt.name === event.recordType);
    if (recordType) {
      setSelectedRecordType(recordType);
      setSelectedRecord(event.data);
      setView('new-record');
    }
  };

  const handleSaveRecord = () => {
    setView('calendar');
    setSelectedRecord(null);
  };

  const handleSaveRecordType = () => {
    setView('calendar');
    initializeApp(); // Refresh record types
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Initializing CLUR...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white dark:bg-gray-800 shadow-lg transition-all duration-300`}>
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">CLUR</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        
        <nav className="p-4">
          <button
            onClick={() => setView('calendar')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              view === 'calendar' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Calendar className="w-5 h-5" />
            {sidebarOpen && <span>Calendar</span>}
          </button>
          
          <div className="mt-4">
            {sidebarOpen && (
              <div className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-2">Records</div>
            )}
            {recordTypes.map(type => (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedRecordType(type);
                  setView('records');
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  view === 'records' && selectedRecordType?.id === type.id
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
                {sidebarOpen && <span className="text-sm">{type.display_name}</span>}
              </button>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <button
              onClick={() => setView('new-type')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <Database className="w-5 h-5" />
              {sidebarOpen && <span>New Record Type</span>}
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {view === 'calendar' && (
          <CalendarView onEventClick={handleEventClick} />
        )}
        
        {view === 'records' && selectedRecordType && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedRecordType.display_name} Records</h2>
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  setView('new-record');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New {selectedRecordType.display_name}
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-gray-900 dark:text-gray-100">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-300">ID</th>
                    <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-300">Details</th>
                    <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-300">Created</th>
                    <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(record => (
                    <tr key={record.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-2 px-4 text-sm text-gray-900 dark:text-gray-100">{record.id}</td>
                      <td className="py-2 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {record.first_name && record.last_name
                          ? `${record.first_name} ${record.last_name}`
                          : record.title || record.name || 'N/A'}
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(record.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-4">
                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            setView('new-record');
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {records.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No {selectedRecordType.display_name.toLowerCase()} records found
                </div>
              )}
            </div>
          </div>
        )}
        
        {view === 'new-record' && selectedRecordType && (
          <DynamicForm
            recordType={selectedRecordType}
            initialData={selectedRecord}
            onSave={handleSaveRecord}
            onCancel={() => setView('records')}
          />
        )}
        
        {view === 'new-type' && (
          <RecordTypeBuilder
            onSave={handleSaveRecordType}
            onCancel={() => setView('calendar')}
          />
        )}
      </div>
    </div>
  );
}