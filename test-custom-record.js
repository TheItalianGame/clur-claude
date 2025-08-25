// Test script for custom record type creation
const testCustomRecord = async () => {
  const baseUrl = 'http://localhost:3001';
  
  // Create a custom record type with fields
  const customRecordType = {
    recordType: {
      id: `custom-inventory-${Date.now()}`,
      name: 'inventory_item',
      display_name: 'Inventory Item',
      color: '#9333EA',
      icon: 'Package',
      is_system: false
    },
    fields: [
      {
        field_name: 'item_name',
        display_name: 'Item Name',
        field_type: 'text',
        is_required: true
      },
      {
        field_name: 'quantity',
        display_name: 'Quantity',
        field_type: 'number',
        is_required: true,
        default_value: '0'
      },
      {
        field_name: 'unit_price',
        display_name: 'Unit Price',
        field_type: 'number',
        is_required: false
      },
      {
        field_name: 'supplier',
        display_name: 'Supplier',
        field_type: 'text',
        is_required: false
      },
      {
        field_name: 'expiry_date',
        display_name: 'Expiry Date',
        field_type: 'date',
        is_required: false
      },
      {
        field_name: 'is_active',
        display_name: 'Active',
        field_type: 'boolean',
        default_value: 'true'
      }
    ],
    calendarSettings: {
      date_field: 'expiry_date',
      title_field: 'item_name',
      show_on_calendar: true
    }
  };
  
  console.log('Creating custom record type: Inventory Item');
  
  try {
    // Create the record type
    const createResponse = await fetch(`${baseUrl}/api/record-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customRecordType)
    });
    
    const createResult = await createResponse.json();
    console.log('Record type created:', createResult);
    
    if (createResult.success) {
      console.log('\n✅ Custom record type created successfully!');
      console.log('Record type ID:', createResult.id);
      console.log('\nThe following should have happened automatically:');
      console.log('1. Table "tbl_inventory_item" created in SQLite');
      console.log('2. Columns added for all fields with proper SQL types');
      console.log('3. Indexes created for performance');
      console.log('4. Migration logged in schema_migrations table');
      
      // Now try to create a record in the new table
      console.log('\nTesting record creation in new table...');
      const testRecord = {
        item_name: 'Test Medical Supply',
        quantity: 100,
        unit_price: 25.50,
        supplier: 'Medical Supplies Inc',
        expiry_date: '2025-12-31',
        is_active: true
      };
      
      const recordResponse = await fetch(`${baseUrl}/api/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordTypeId: createResult.id,
          data: testRecord
        })
      });
      
      const recordResult = await recordResponse.json();
      console.log('Test record created:', recordResult);
      
      if (recordResult.id) {
        console.log('\n✅ Successfully created record in custom table!');
        console.log('Record ID:', recordResult.id);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run the test
testCustomRecord();