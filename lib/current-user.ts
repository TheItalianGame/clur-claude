// Current user context for the application
// In a real application, this would come from authentication
// For now, we're hardcoding Eli Baum as the current user

export const CURRENT_USER = {
  id: 'emp-eli',
  first_name: 'Eli',
  last_name: 'Baum',
  email: 'eli.baum@clinic.com',
  role: 'Lead Developer',
  department: 'IT'
};

export function getCurrentUserId(): string {
  return CURRENT_USER.id;
}

export function getCurrentUserName(): string {
  return `${CURRENT_USER.first_name} ${CURRENT_USER.last_name}`;
}