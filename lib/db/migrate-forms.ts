import db from './index';
import { generateDefaultFormLayout } from '../form-templates';

export function migrateFormsToNewFormat() {
  try {
    console.log('Migrating forms to new format...');
    
    // Get all form definitions
    const forms = db.prepare(`
      SELECT fd.*, rt.name as record_type_name 
      FROM form_definitions fd
      JOIN record_types rt ON fd.record_type_id = rt.id
    `).all() as any[];
    
    let migrated = 0;
    
    for (const form of forms) {
      try {
        const layout = JSON.parse(form.layout);
        let needsUpdate = false;
        
        // Check if this is the old format
        if (layout.sections && layout.sections.length > 0) {
          for (const section of layout.sections) {
            // Old format has fields: 'all' or title instead of name
            if (section.fields === 'all' || section.title) {
              needsUpdate = true;
              break;
            }
          }
        }
        
        if (needsUpdate) {
          // Get fields for this record type
          const fields = db.prepare(`
            SELECT * FROM field_definitions 
            WHERE record_type_id = ? 
            ORDER BY order_index
          `).all(form.record_type_id) as any[];
          
          // Generate new layout
          const newLayout = generateDefaultFormLayout(fields);
          
          // Update the form with new layout
          db.prepare(`
            UPDATE form_definitions 
            SET layout = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(JSON.stringify(newLayout), form.id);
          
          console.log(`Migrated form: ${form.name} (${form.record_type_name})`);
          migrated++;
        }
      } catch (error) {
        console.error(`Error migrating form ${form.id}:`, error);
      }
    }
    
    // Also ensure all record types have at least one form
    const recordTypes = db.prepare(`
      SELECT rt.* FROM record_types rt
      LEFT JOIN form_definitions fd ON rt.id = fd.record_type_id
      WHERE fd.id IS NULL
    `).all() as any[];
    
    for (const recordType of recordTypes) {
      // Get fields for this record type
      const fields = db.prepare(`
        SELECT * FROM field_definitions 
        WHERE record_type_id = ? 
        ORDER BY order_index
      `).all(recordType.id) as any[];
      
      if (fields.length > 0) {
        const layout = generateDefaultFormLayout(fields);
        
        // Create default form
        db.prepare(`
          INSERT INTO form_definitions (id, record_type_id, name, is_default, layout)
          VALUES (?, ?, ?, 1, ?)
        `).run(
          `form-${recordType.id}-default`,
          recordType.id,
          `${recordType.display_name} Form`,
          JSON.stringify(layout)
        );
        
        console.log(`Created default form for: ${recordType.display_name}`);
        migrated++;
      }
    }
    
    console.log(`Migration complete! Migrated ${migrated} forms.`);
    return migrated;
  } catch (error) {
    console.error('Error during form migration:', error);
    throw error;
  }
}

// Auto-run migration when imported
migrateFormsToNewFormat();