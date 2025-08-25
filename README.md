# EHR Calendar System

A dynamic Electronic Health Records (EHR) system with integrated calendar functionality built with Next.js, TypeScript, and SQLite. This system provides a flexible, extensible platform for managing healthcare records with customizable record types and fields.

## Features

- **Dynamic Record System**: Create and manage custom record types with configurable fields
- **Integrated Calendar**: View and manage appointments, meetings, and scheduled events
- **Patient Management**: Comprehensive patient records with medical history tracking
- **Employee Management**: Staff directory with role-based organization
- **Visit Tracking**: Schedule and document patient visits with detailed notes
- **Customizable Forms**: Dynamic form builder for data entry
- **Dark/Light Theme**: Modern UI with theme switching support
- **Extensible Architecture**: Easy to add new record types and fields

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Database**: SQLite with Better-SQLite3
- **Styling**: Tailwind CSS
- **Calendar**: FullCalendar
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Prerequisites

- Node.js 18+ 
- npm or yarn package manager

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ehr-calendar
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Initialize the Database

The application uses SQLite for data storage. The database file (`ehr.db`) is already included with sample data. If you want to start fresh:

#### Option A: Keep existing database with sample data
The repository includes a pre-populated database with sample employees, patients, visits, and other records.

#### Option B: Reinitialize with fresh data

```bash
# Remove existing database
rm ehr.db ehr.db-shm ehr.db-wal

# The database will be automatically recreated on first run
# To populate with sample data after first run, you can use the SQL files:
sqlite3 ehr.db < lib/db/init-system-tables.sql
sqlite3 ehr.db < lib/db/init-sample-data.sql
```

### 4. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
ehr-calendar/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── calendar/          # Calendar page
│   ├── forms/             # Form management
│   ├── record-types/      # Record type management
│   ├── records/           # Record CRUD operations
│   └── settings/          # Settings page
├── components/            # React components
│   ├── calendar/          # Calendar components
│   ├── forms/             # Form components
│   ├── layout/            # Layout components
│   └── ui/                # UI components
├── lib/                   # Utility functions and database
│   ├── db/                # Database schema and queries
│   │   ├── init-system-tables.sql  # System table definitions
│   │   └── init-sample-data.sql    # Sample data
│   └── types.ts           # TypeScript type definitions
└── public/                # Static assets
```

## Database Schema

The system uses a flexible schema with the following key tables:

### Core Tables
- `record_types` - Defines available record types (source of truth)
- `record_categories` - Groups record types into categories
- `field_definitions` - Defines fields for each record type
- `dynamic_records` - Stores custom record data as JSON

### System Tables
- `employees` - Staff members and providers
- `patients` - Patient demographics and information
- `visits` - Patient visits and appointments
- `meetings` - Staff meetings and events

### Dynamic Tables
- `dt_*` - System-defined dynamic record tables
- `cdt_*` - Custom user-defined record tables

## Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

## API Endpoints

### Record Types
- `GET /api/record-types` - List all record types
- `POST /api/record-types` - Create new record type
- `GET /api/record-types/[id]` - Get specific record type
- `PUT /api/record-types/[id]` - Update record type
- `DELETE /api/record-types/[id]` - Delete record type

### Records
- `GET /api/records/[type]` - List records of a type
- `POST /api/records/[type]` - Create new record
- `GET /api/records/[type]/[id]` - Get specific record
- `PUT /api/records/[type]/[id]` - Update record
- `DELETE /api/records/[type]/[id]` - Delete record

### Calendar
- `GET /api/calendar/events` - Get calendar events

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create new category

## Default Users

The system comes with sample employee accounts:

| Name | Email | Role |
|------|-------|------|
| John Smith | john.smith@clinic.com | Chief Medical Officer |
| Sarah Johnson | sarah.johnson@clinic.com | Lead Physician |
| Michael Williams | michael.williams@clinic.com | Physician |
| Emily Brown | emily.brown@clinic.com | Nurse Practitioner |

## Customization

### Adding New Record Types

1. Navigate to Settings → Record Types
2. Click "New Record Type"
3. Define the record type properties
4. Add custom fields
5. Configure display settings

### Modifying Forms

Forms are automatically generated based on field definitions but can be customized through the Form Builder interface.

### Theme Customization

The application supports light and dark themes. Theme can be toggled using the theme button in the UI.

## Development Notes

- The application uses SQLite for simplicity and portability
- All database operations are performed through the Better-SQLite3 library
- The system is designed to be extensible with new record types
- Dynamic records are stored as JSON in the database for flexibility

## Troubleshooting

### Database Issues
If you encounter database errors:
1. Check that the database file has proper permissions
2. Try removing `.db-shm` and `.db-wal` files
3. Reinitialize the database using the SQL scripts

### Port Already in Use
If port 3000 is already in use:
```bash
npm run dev -- -p 3001
```

## License

This project is provided as-is for educational and development purposes.

## Support

For issues or questions, please refer to the documentation or create an issue in the repository.
