import db from './index';
import { FieldDefinition, RecordType } from '../types';

// Map field types to SQL column types
const fieldTypeToSqlType: { [key: string]: string } = {
  'text': 'TEXT',
  'textarea': 'TEXT',
  'number': 'REAL',
  'date': 'DATE',
  'datetime': 'DATETIME',
  'boolean': 'BOOLEAN',
  'select': 'TEXT',
  'multiselect': 'TEXT', // Store as JSON
  'relation': 'TEXT', // Store foreign key
  'email': 'TEXT',
  'phone': 'TEXT',
  'url': 'TEXT',
  'json': 'TEXT'
};

// Track schema changes
export interface SchemaChange {
  record_type_id: string;
  change_type: 'create_table' | 'add_column' | 'drop_column' | 'modify_column';
  details: string;
  executed_at?: string;
}

// Create migrations tracking table
export function initializeMigrationTracking() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_type_id TEXT NOT NULL,
      change_type TEXT NOT NULL,
      details TEXT NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Get table name for a record type
export function getTableName(recordType: RecordType): string {
  // Core system tables keep their existing names
  if (['employee', 'patient', 'visit', 'meeting'].includes(recordType.name)) {
    switch (recordType.name) {
      case 'employee': return 'employees';
      case 'patient': return 'patients';
      case 'visit': return 'visits';
      case 'meeting': return 'meetings';
      default: return `dt_${recordType.name}`;
    }
  }
  
  // System record tables use dt_ prefix
  if (recordType.is_system) {
    return `dt_${recordType.name.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  }
  
  // Custom record tables use cdt_ prefix
  return `cdt_${recordType.name.replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

// Check if a table exists
export function tableExists(tableName: string): boolean {
  const result = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name = ?
  `).get(tableName) as any;
  return !!result;
}

// Get columns of a table
export function getTableColumns(tableName: string): string[] {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
  return columns.map(col => col.name);
}

// Create a new table for a record type
export function createTableForRecordType(recordType: RecordType, fields: FieldDefinition[]) {
  const tableName = getTableName(recordType);
  
  if (tableExists(tableName)) {
    console.log(`Table ${tableName} already exists`);
    return;
  }
  
  // Ensure migrations table exists
  initializeMigrationTracking();
  
  // Build column definitions
  const columns = [
    'id TEXT PRIMARY KEY',
    'created_at DATETIME DEFAULT CURRENT_TIMESTAMP',
    'updated_at DATETIME DEFAULT CURRENT_TIMESTAMP',
    'created_by TEXT'
  ];
  
  // System columns that shouldn't be duplicated
  const systemColumns = ['id', 'created_at', 'updated_at', 'created_by'];
  
  // Add foreign key constraints for relation fields
  const foreignKeys: string[] = [];
  
  for (const field of fields) {
    // Skip if this is a system column
    if (systemColumns.includes(field.field_name)) {
      continue;
    }
    
    // Add cf_ prefix to custom fields if not already present and it's a custom record type
    let fieldName = field.field_name;
    if (!recordType.is_system && !fieldName.startsWith('cf_') && 
        !systemColumns.includes(fieldName)) {
      fieldName = `cf_${fieldName}`;
    }
    
    const sqlType = fieldTypeToSqlType[field.field_type] || 'TEXT';
    const nullable = field.is_required ? 'NOT NULL' : '';
    const defaultValue = field.default_value ? `DEFAULT '${field.default_value}'` : '';
    
    columns.push(`${fieldName} ${sqlType} ${nullable} ${defaultValue}`.trim());
    
    // Add foreign key constraint for relation fields
    if (field.field_type === 'relation' && field.options) {
      try {
        const options = JSON.parse(field.options);
        if (options.record_type) {
          const relatedType = db.prepare('SELECT * FROM record_types WHERE name = ?').get(options.record_type) as any;
          if (relatedType) {
            const relatedTableName = getTableName(relatedType);
            foreignKeys.push(`FOREIGN KEY (${fieldName}) REFERENCES ${relatedTableName}(id)`);
          }
        }
      } catch (e) {
        // Skip if options parsing fails
      }
    }
  }
  
  // Combine columns and foreign keys
  const tableDefinition = [...columns, ...foreignKeys].join(',\n    ');
  
  // Create the table
  const sql = `
    CREATE TABLE ${tableName} (
      ${tableDefinition}
    )
  `;
  
  console.log(`Creating table ${tableName} for record type ${recordType.display_name}`);
  db.exec(sql);
  
  // Create indexes
  db.exec(`CREATE INDEX idx_${tableName}_created_at ON ${tableName}(created_at)`);
  db.exec(`CREATE INDEX idx_${tableName}_updated_at ON ${tableName}(updated_at)`);
  
  // Log migration
  db.prepare(`
    INSERT INTO schema_migrations (record_type_id, change_type, details)
    VALUES (?, 'create_table', ?)
  `).run(recordType.id, sql);
}

// Sync table columns with field definitions
export function syncTableColumns(recordType: RecordType, fields: FieldDefinition[]) {
  const tableName = getTableName(recordType);
  
  // Create table if it doesn't exist
  if (!tableExists(tableName)) {
    createTableForRecordType(recordType, fields);
    return;
  }
  
  // Get existing columns
  const existingColumns = getTableColumns(tableName);
  const systemColumns = ['id', 'created_at', 'updated_at', 'created_by'];
  
  // Find columns to add
  for (const field of fields) {
    if (!existingColumns.includes(field.field_name)) {
      addColumnToTable(tableName, field, recordType.id);
    }
  }
  
  // Find columns to remove (optional - might want to keep for data preservation)
  const fieldNames = fields.map(f => f.field_name);
  const columnsToRemove = existingColumns.filter(col => 
    !systemColumns.includes(col) && !fieldNames.includes(col)
  );
  
  if (columnsToRemove.length > 0) {
    console.log(`Found unused columns in ${tableName}:`, columnsToRemove);
    // Note: SQLite doesn't support DROP COLUMN easily, would need to recreate table
    // For now, we'll keep old columns to preserve data
  }
}

// Add a column to an existing table
function addColumnToTable(tableName: string, field: FieldDefinition, recordTypeId: string) {
  const sqlType = fieldTypeToSqlType[field.field_type] || 'TEXT';
  const defaultValue = field.default_value ? `DEFAULT '${field.default_value}'` : 
                       field.is_required ? '' : 'DEFAULT NULL';
  
  const sql = `ALTER TABLE ${tableName} ADD COLUMN ${field.field_name} ${sqlType} ${defaultValue}`;
  
  console.log(`Adding column ${field.field_name} to table ${tableName}`);
  
  try {
    db.exec(sql);
    
    // Log migration
    db.prepare(`
      INSERT INTO schema_migrations (record_type_id, change_type, details)
      VALUES (?, 'add_column', ?)
    `).run(recordTypeId, `Added column ${field.field_name} (${sqlType})`);
  } catch (error) {
    console.error(`Error adding column ${field.field_name} to ${tableName}:`, error);
  }
}

// Sync all record types with their tables
export function syncAllRecordTypes() {
  console.log('Starting schema synchronization...');
  
  // Initialize migration tracking
  initializeMigrationTracking();
  
  // Get all record types
  const recordTypes = db.prepare('SELECT * FROM record_types').all() as RecordType[];
  
  for (const recordType of recordTypes) {
    // Get fields for this record type
    const fields = db.prepare(`
      SELECT * FROM field_definitions 
      WHERE record_type_id = ? 
      ORDER BY order_index
    `).all(recordType.id) as FieldDefinition[];
    
    // If there are field definitions, this record type needs a table
    if (fields.length > 0) {
      syncTableColumns(recordType, fields);
    }
  }
  
  console.log('Schema synchronization complete!');
}


// Update queries to use the correct table
export function getRecordsFromTable(recordType: RecordType): any[] {
  const tableName = getTableName(recordType);
  
  if (tableExists(tableName)) {
    const records = db.prepare(`SELECT * FROM ${tableName} ORDER BY created_at DESC`).all() as any[];
    
    // For custom record types, map cf_ prefixed columns back to original field names
    if (!recordType.is_system) {
      return records.map(record => {
        const mappedRecord: any = {};
        for (const [key, value] of Object.entries(record)) {
          // Remove cf_ prefix for API response
          if (key.startsWith('cf_')) {
            mappedRecord[key.substring(3)] = value;
          } else {
            mappedRecord[key] = value;
          }
        }
        return mappedRecord;
      });
    }
    
    return records;
  } else {
    // Fallback to dynamic_records
    const records = db.prepare(`
      SELECT * FROM dynamic_records 
      WHERE record_type_id = ?
      ORDER BY created_at DESC
    `).all(recordType.id) as any[];
    
    return records.map(record => ({
      id: record.id,
      ...JSON.parse(record.data),
      created_at: record.created_at,
      updated_at: record.updated_at
    }));
  }
}

// Insert record into the correct table
export function insertRecordIntoTable(recordType: RecordType, data: any, recordId: string) {
  const tableName = getTableName(recordType);
  
  if (tableExists(tableName)) {
    // Get table columns to only insert valid fields
    const columns = getTableColumns(tableName);
    const validData: any = { id: recordId };
    
    for (const key of Object.keys(data)) {
      // Map field name to column name (add cf_ prefix for custom fields)
      let columnName = key;
      if (!recordType.is_system && !key.startsWith('cf_') && 
          !['id', 'created_at', 'updated_at', 'created_by'].includes(key)) {
        columnName = `cf_${key}`;
      }
      
      if (columns.includes(columnName) && key !== 'id') {
        validData[columnName] = data[key];
      } else if (columns.includes(key) && key !== 'id') {
        validData[key] = data[key];
      }
    }
    
    const keys = Object.keys(validData);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => validData[k]);
    
    db.prepare(`
      INSERT INTO ${tableName} (${keys.join(', ')})
      VALUES (${placeholders})
    `).run(...values);
  } else {
    // Fallback to dynamic_records
    db.prepare(`
      INSERT INTO dynamic_records (id, record_type_id, data)
      VALUES (?, ?, ?)
    `).run(recordId, recordType.id, JSON.stringify(data));
  }
}

// Update record in the correct table
export function updateRecordInTable(recordType: RecordType, recordId: string, data: any) {
  const tableName = getTableName(recordType);
  
  console.log('Updating record:', { tableName, recordId, data });
  
  if (tableExists(tableName)) {
    // Get table columns to only update valid fields
    const columns = getTableColumns(tableName);
    console.log('Available columns in table:', columns);
    const validData: any = {};
    
    for (const key of Object.keys(data)) {
      // Map field name to column name (add cf_ prefix for custom fields)
      let columnName = key;
      if (!recordType.is_system && !key.startsWith('cf_') && 
          !['id', 'created_at', 'updated_at', 'created_by'].includes(key)) {
        columnName = `cf_${key}`;
      }
      
      if (columns.includes(columnName) && key !== 'id' && key !== 'created_at') {
        validData[columnName] = data[key];
      } else if (columns.includes(key) && key !== 'id' && key !== 'created_at') {
        validData[key] = data[key];
      }
    }
    
    console.log('Valid data to update:', validData);
    
    if (Object.keys(validData).length === 0) {
      console.warn('No valid fields to update');
      return;
    }
    
    const setClause = Object.keys(validData).map(k => `${k} = ?`).join(', ');
    const values = Object.keys(validData).map(k => validData[k]);
    values.push(recordId);
    
    const result = db.prepare(`
      UPDATE ${tableName} 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(...values);
    
    console.log('Update result:', result);
  } else {
    // Fallback to dynamic_records
    db.prepare(`
      UPDATE dynamic_records 
      SET data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(data), recordId);
  }
}

// Delete record from the correct table
export function deleteRecordFromTable(recordType: RecordType, recordId: string) {
  const tableName = getTableName(recordType);
  
  if (tableExists(tableName)) {
    db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(recordId);
  } else {
    db.prepare(`DELETE FROM dynamic_records WHERE id = ?`).run(recordId);
  }
}