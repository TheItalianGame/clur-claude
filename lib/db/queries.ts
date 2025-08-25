import db from './index';
import { RecordType, FieldDefinition, FormDefinition, CalendarSettings, CalendarEvent } from '../types';
import { 
  getTableName, tableExists, getRecordsFromTable, 
  insertRecordIntoTable, updateRecordInTable, 
  deleteRecordFromTable, syncTableColumns 
} from './schema-sync';

export const recordTypeQueries = {
  getAll: () => {
    return db.prepare('SELECT * FROM record_types ORDER BY display_name').all() as RecordType[];
  },
  
  getById: (id: string) => {
    return db.prepare('SELECT * FROM record_types WHERE id = ?').get(id) as RecordType;
  },
  
  create: (recordType: Omit<RecordType, 'created_at' | 'updated_at'>) => {
    const stmt = db.prepare(`
      INSERT INTO record_types (id, name, display_name, color, icon, category_id, is_system)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      recordType.id, 
      recordType.name, 
      recordType.display_name, 
      recordType.color, 
      recordType.icon, 
      recordType.category_id || 'cat-custom',
      recordType.is_system ? 1 : 0
    );
    return recordType.id;
  },
  
  update: (id: string, updates: Partial<RecordType>) => {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);
    
    const stmt = db.prepare(`UPDATE record_types SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    return stmt.run(...values);
  },
  
  delete: (id: string) => {
    return db.prepare('DELETE FROM record_types WHERE id = ? AND is_system = 0').run(id);
  }
};

export const fieldDefinitionQueries = {
  getByRecordType: (recordTypeId: string) => {
    return db.prepare('SELECT * FROM field_definitions WHERE record_type_id = ? ORDER BY order_index').all(recordTypeId) as FieldDefinition[];
  },
  
  getById: (id: string) => {
    return db.prepare('SELECT * FROM field_definitions WHERE id = ?').get(id) as FieldDefinition;
  },
  
  create: (field: Omit<FieldDefinition, 'created_at'>) => {
    const stmt = db.prepare(`
      INSERT INTO field_definitions (id, record_type_id, field_name, display_name, field_type, is_required, default_value, options, validation_rules, order_index, show_in_employee_calendar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(field.id, field.record_type_id, field.field_name, field.display_name, field.field_type, field.is_required ? 1 : 0, field.default_value, field.options, field.validation_rules, field.order_index, field.show_in_employee_calendar ? 1 : 0);
    return field.id;
  },
  
  update: (id: string, updates: Partial<FieldDefinition>) => {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);
    
    const stmt = db.prepare(`UPDATE field_definitions SET ${fields} WHERE id = ?`);
    return stmt.run(...values);
  },
  
  delete: (id: string) => {
    return db.prepare('DELETE FROM field_definitions WHERE id = ?').run(id);
  }
};

export const formDefinitionQueries = {
  getByRecordType: (recordTypeId: string) => {
    return db.prepare('SELECT * FROM form_definitions WHERE record_type_id = ? ORDER BY is_default DESC, name').all(recordTypeId) as FormDefinition[];
  },
  
  getDefault: (recordTypeId: string) => {
    return db.prepare('SELECT * FROM form_definitions WHERE record_type_id = ? AND is_default = 1').get(recordTypeId) as FormDefinition;
  },
  
  create: (form: Omit<FormDefinition, 'created_at' | 'updated_at'>) => {
    const stmt = db.prepare(`
      INSERT INTO form_definitions (id, record_type_id, name, is_default, layout)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(form.id, form.record_type_id, form.name, form.is_default ? 1 : 0, form.layout);
    return form.id;
  },
  
  update: (id: string, updates: Partial<FormDefinition>) => {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);
    
    const stmt = db.prepare(`UPDATE form_definitions SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    return stmt.run(...values);
  },
  
  setDefault: (recordTypeId: string, formId: string) => {
    db.prepare('UPDATE form_definitions SET is_default = 0 WHERE record_type_id = ?').run(recordTypeId);
    db.prepare('UPDATE form_definitions SET is_default = 1 WHERE id = ?').run(formId);
  }
};

export const calendarQueries = {
  getSettings: (recordTypeId: string) => {
    return db.prepare('SELECT * FROM calendar_settings WHERE record_type_id = ?').get(recordTypeId) as CalendarSettings;
  },
  
  createSettings: (settings: Omit<CalendarSettings, 'created_at'>) => {
    const stmt = db.prepare(`
      INSERT INTO calendar_settings (id, record_type_id, date_field, title_field, show_on_calendar)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(settings.id, settings.record_type_id, settings.date_field, settings.title_field, settings.show_on_calendar ? 1 : 0);
    return settings.id;
  },
  
  updateSettings: (recordTypeId: string, settings: Partial<CalendarSettings>) => {
    const fields = Object.keys(settings).map(key => `${key} = ?`).join(', ');
    const values = Object.values(settings);
    values.push(recordTypeId);
    
    const stmt = db.prepare(`UPDATE calendar_settings SET ${fields} WHERE record_type_id = ?`);
    return stmt.run(...values);
  },
  
  getEventsForDateRange: (startDate: string, endDate: string, employeeId?: string): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const recordTypes = db.prepare('SELECT * FROM record_types').all() as RecordType[];
    
    recordTypes.forEach(recordType => {
      const settings = db.prepare('SELECT * FROM calendar_settings WHERE record_type_id = ?').get(recordType.id) as CalendarSettings;
      
      if (settings && settings.show_on_calendar) {
        let records: any[] = [];
        
        // Get records based on whether it's a system or custom type
        if (recordType.is_system) {
          // System tables - directly query the table
          const tableName = recordType.name === 'employee' ? 'employees' :
                           recordType.name === 'patient' ? 'patients' :
                           recordType.name === 'visit' ? 'visits' :
                           recordType.name === 'meeting' ? 'meetings' : null;
          
          if (tableName) {
            const dateColumn = settings.date_field;
            records = db.prepare(`
              SELECT * FROM ${tableName}
              WHERE DATE(${dateColumn}) >= DATE(?)
              AND DATE(${dateColumn}) <= DATE(?)
            `).all(startDate, endDate) as any[];
          }
        } else {
          // Custom records - query dynamic_records table
          records = db.prepare(`
            SELECT * FROM dynamic_records 
            WHERE record_type_id = ? 
            AND DATE(json_extract(data, '$.${settings.date_field}')) >= DATE(?)
            AND DATE(json_extract(data, '$.${settings.date_field}')) <= DATE(?)
          `).all(recordType.id, startDate, endDate) as any[];
        }
        
        records.forEach(record => {
          let eventData: any;
          let eventTitle: string;
          let eventDate: Date;
          let isRelevantToEmployee = true;
          
          if (recordType.is_system) {
            eventData = record;
            eventTitle = record[settings.title_field] || recordType.display_name;
            eventDate = new Date(record[settings.date_field]);
            
            // Check employee relevance for system records
            if (employeeId) {
              isRelevantToEmployee = false;
              
              // Check direct employee fields
              if (record.provider_id === employeeId || 
                  record.organizer_id === employeeId ||
                  record.employee_id === employeeId ||
                  record.primary_provider_id === employeeId) {
                isRelevantToEmployee = true;
              }
              
              // Check attendees for meetings
              if (record.attendees) {
                try {
                  const attendees = JSON.parse(record.attendees);
                  if (Array.isArray(attendees) && attendees.includes(employeeId)) {
                    isRelevantToEmployee = true;
                  }
                } catch (e) {}
              }
            }
          } else {
            const data = JSON.parse(record.data);
            eventData = data;
            eventTitle = data[settings.title_field] || recordType.display_name;
            eventDate = new Date(data[settings.date_field]);
            
            // Check employee relevance for custom records
            if (employeeId) {
              isRelevantToEmployee = false;
              
              // Get field definitions to check for employee-relevant fields
              const fields = fieldDefinitionQueries.getByRecordType(recordType.id);
              fields.forEach(field => {
                if (field.show_in_employee_calendar) {
                  if (field.field_type === 'relation') {
                    // Check if this field references the employee
                    if (data[field.field_name] === employeeId) {
                      isRelevantToEmployee = true;
                    }
                  } else if (field.field_type === 'multiselect') {
                    // Check if employee is in the multiselect array
                    const fieldValue = data[field.field_name];
                    if (fieldValue) {
                      try {
                        const values = Array.isArray(fieldValue) ? fieldValue : JSON.parse(fieldValue);
                        if (Array.isArray(values) && values.includes(employeeId)) {
                          isRelevantToEmployee = true;
                        }
                      } catch (e) {
                        // If not JSON, check if it's a direct match
                        if (fieldValue === employeeId) {
                          isRelevantToEmployee = true;
                        }
                      }
                    }
                  }
                }
              });
            }
          }
          
          if (isRelevantToEmployee) {
            events.push({
              id: record.id,
              title: eventTitle,
              date: eventDate,
              color: recordType.color,
              recordType: recordType.name,
              recordTypeDisplay: recordType.display_name,
              data: eventData
            });
          }
        });
      }
    });
    
    return events;
  }
};

export const dynamicRecordQueries = {
  // Unified function to get records of any type
  getRecords: (recordTypeIdOrName: string) => {
    // First try to get by ID, then by name
    let recordType = recordTypeQueries.getById(recordTypeIdOrName);
    if (!recordType) {
      // Try by name
      recordType = db.prepare('SELECT * FROM record_types WHERE name = ?').get(recordTypeIdOrName) as any;
    }
    if (!recordType) return [];
    
    // Ensure table exists and is synced
    const fields = fieldDefinitionQueries.getByRecordType(recordType.id);
    if (fields.length > 0) {
      syncTableColumns(recordType, fields);
    }
    
    // Get records from the appropriate table
    return getRecordsFromTable(recordType);
  },
  
  getRecord: (recordTypeIdOrName: string, recordId: string) => {
    // First try to get by ID, then by name
    let recordType = recordTypeQueries.getById(recordTypeIdOrName);
    if (!recordType) {
      // Try by name
      recordType = db.prepare('SELECT * FROM record_types WHERE name = ?').get(recordTypeIdOrName) as any;
    }
    if (!recordType) return null;
    
    const tableName = getTableName(recordType);
    
    if (tableExists(tableName)) {
      const record = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(recordId) as any;
      if (record && !recordType.is_system) {
        // Map cf_ prefixed columns back to original field names for custom records
        const mappedRecord: any = {};
        for (const [key, value] of Object.entries(record)) {
          if (key.startsWith('cf_')) {
            mappedRecord[key.substring(3)] = value;
          } else {
            mappedRecord[key] = value;
          }
        }
        return mappedRecord;
      }
      return record;
    } else {
      // Fallback to dynamic_records
      const record = db.prepare('SELECT * FROM dynamic_records WHERE id = ?').get(recordId) as any;
      if (record) {
        return {
          id: record.id,
          ...JSON.parse(record.data),
          created_at: record.created_at,
          updated_at: record.updated_at
        };
      }
    }
    
    return null;
  },
  
  createRecord: (recordTypeIdOrName: string, data: any, createdBy?: string) => {
    // First try to get by ID, then by name
    let recordType = recordTypeQueries.getById(recordTypeIdOrName);
    if (!recordType) {
      // Try by name
      recordType = db.prepare('SELECT * FROM record_types WHERE name = ?').get(recordTypeIdOrName) as any;
    }
    if (!recordType) throw new Error('Record type not found');
    
    // Ensure table exists and is synced
    const fields = fieldDefinitionQueries.getByRecordType(recordType.id);
    if (fields.length > 0) {
      syncTableColumns(recordType, fields);
    }
    
    const id = `${recordType.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Insert into the appropriate table
    insertRecordIntoTable(recordType, { ...data, created_by: createdBy }, id);
    
    return id;
  },
  
  updateRecord: (recordTypeIdOrName: string, recordId: string, data: any) => {
    // First try to get by ID, then by name
    let recordType = recordTypeQueries.getById(recordTypeIdOrName);
    if (!recordType) {
      // Try by name
      recordType = db.prepare('SELECT * FROM record_types WHERE name = ?').get(recordTypeIdOrName) as any;
    }
    if (!recordType) throw new Error('Record type not found');
    
    // Update in the appropriate table
    updateRecordInTable(recordType, recordId, data);
  },
  
  deleteRecord: (recordTypeIdOrName: string, recordId: string) => {
    // First try to get by ID, then by name
    let recordType = recordTypeQueries.getById(recordTypeIdOrName);
    if (!recordType) {
      // Try by name
      recordType = db.prepare('SELECT * FROM record_types WHERE name = ?').get(recordTypeIdOrName) as any;
    }
    if (!recordType) throw new Error('Record type not found');
    
    // Delete from the appropriate table
    deleteRecordFromTable(recordType, recordId);
  }
};