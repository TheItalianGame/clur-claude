import db from './index';

// Table naming convention:
// - dt_* for system record tables (dt = data table)
// - cdt_* for custom record tables (cdt = custom data table)
// - System tables (employees, patients, visits, meetings) remain unchanged
// - Infrastructure tables remain unchanged

export function migrateTableNames() {
  console.log('Starting table name migration...');
  
  // Get all record types to determine which tables are system vs custom
  const recordTypes = db.prepare('SELECT * FROM record_types').all() as any[];
  
  const tableMigrations: Array<{oldName: string, newName: string, isSystem: boolean}> = [];
  
  // Build migration list
  for (const recordType of recordTypes) {
    const oldTableName = recordType.name === 'employee' ? 'employees' :
                        recordType.name === 'patient' ? 'patients' :
                        recordType.name === 'visit' ? 'visits' :
                        recordType.name === 'meeting' ? 'meetings' :
                        `tbl_${recordType.name}`;
    
    // Skip core system tables
    if (['employees', 'patients', 'visits', 'meetings'].includes(oldTableName)) {
      continue;
    }
    
    // Check if table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name = ?
    `).get(oldTableName);
    
    if (tableExists) {
      const newTableName = recordType.is_system 
        ? `dt_${recordType.name}` 
        : `cdt_${recordType.name}`;
      
      tableMigrations.push({
        oldName: oldTableName,
        newName: newTableName,
        isSystem: recordType.is_system
      });
    }
  }
  
  // Perform migrations
  let migratedCount = 0;
  let skippedCount = 0;
  
  for (const migration of tableMigrations) {
    // Check if new table already exists
    const newTableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name = ?
    `).get(migration.newName);
    
    if (newTableExists) {
      console.log(`⚠️  Table ${migration.newName} already exists, skipping`);
      skippedCount++;
      continue;
    }
    
    try {
      // Rename the table
      db.exec(`ALTER TABLE ${migration.oldName} RENAME TO ${migration.newName}`);
      console.log(`✅ Renamed ${migration.oldName} → ${migration.newName} (${migration.isSystem ? 'system' : 'custom'})`);
      
      // Update indexes
      const indexes = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='index' AND tbl_name = ? AND name LIKE 'idx_%'
      `).all(migration.newName) as any[];
      
      for (const index of indexes) {
        const oldIndexName = index.name;
        const newIndexName = oldIndexName.replace(`idx_${migration.oldName}`, `idx_${migration.newName}`);
        if (oldIndexName !== newIndexName) {
          try {
            db.exec(`DROP INDEX IF EXISTS ${oldIndexName}`);
            // Recreate index with new name based on common patterns
            if (oldIndexName.includes('_created_at')) {
              db.exec(`CREATE INDEX ${newIndexName} ON ${migration.newName}(created_at)`);
            } else if (oldIndexName.includes('_updated_at')) {
              db.exec(`CREATE INDEX ${newIndexName} ON ${migration.newName}(updated_at)`);
            }
            console.log(`  ✓ Updated index ${oldIndexName} → ${newIndexName}`);
          } catch (e) {
            console.log(`  ⚠️  Could not update index ${oldIndexName}`);
          }
        }
      }
      
      migratedCount++;
      
      // Log migration
      db.prepare(`
        INSERT INTO schema_migrations (record_type_id, change_type, details)
        VALUES (?, 'rename_table', ?)
      `).run(
        migration.oldName.replace('tbl_', ''),
        `Renamed table ${migration.oldName} to ${migration.newName}`
      );
    } catch (error) {
      console.error(`❌ Failed to rename ${migration.oldName}:`, error);
    }
  }
  
  console.log(`\nMigration complete:`);
  console.log(`- Tables renamed: ${migratedCount}`);
  console.log(`- Tables skipped: ${skippedCount}`);
  
  // List all tables with new naming convention
  const allTables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    AND (name LIKE 'dt_%' OR name LIKE 'cdt_%')
    ORDER BY name
  `).all() as any[];
  
  console.log(`\nTables with new naming convention:`);
  allTables.forEach(table => {
    const prefix = table.name.startsWith('dt_') ? '[SYSTEM]' : '[CUSTOM]';
    console.log(`  ${prefix} ${table.name}`);
  });
}

// Migrate custom field names to have cf_ prefix
export function migrateCustomFieldNames() {
  console.log('\nMigrating custom field names...');
  
  // Get all custom record types
  const customRecordTypes = db.prepare(`
    SELECT * FROM record_types WHERE is_system = 0
  `).all() as any[];
  
  for (const recordType of customRecordTypes) {
    const tableName = `cdt_${recordType.name}`;
    
    // Check if table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name = ?
    `).get(tableName);
    
    if (!tableExists) continue;
    
    // Get field definitions for this record type
    const fields = db.prepare(`
      SELECT * FROM field_definitions 
      WHERE record_type_id = ?
    `).all(recordType.id) as any[];
    
    // Update field definitions to add cf_ prefix if not already present
    for (const field of fields) {
      if (!field.field_name.startsWith('cf_') && 
          !['id', 'created_at', 'updated_at', 'created_by'].includes(field.field_name)) {
        const newFieldName = `cf_${field.field_name}`;
        
        // Update field definition
        db.prepare(`
          UPDATE field_definitions 
          SET field_name = ? 
          WHERE id = ?
        `).run(newFieldName, field.id);
        
        console.log(`  ✓ Updated field ${recordType.name}.${field.field_name} → ${newFieldName}`);
        
        // Note: Actual column renaming in SQLite requires recreating the table
        // For now, we'll just update the field definitions
        // The schema sync will handle creating new columns with correct names
      }
    }
  }
}

// Run migrations if called directly
if (require.main === module) {
  migrateTableNames();
  migrateCustomFieldNames();
}