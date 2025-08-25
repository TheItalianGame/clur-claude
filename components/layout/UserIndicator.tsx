'use client';

import { User, LogOut } from 'lucide-react';
import { getCurrentUserName, CURRENT_USER } from '@/lib/current-user';

export default function UserIndicator() {
  return (
    <div className="fixed top-4 right-4 z-40 flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-2 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {getCurrentUserName()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {CURRENT_USER.role}
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          // Placeholder for logout functionality
          alert('Logout functionality will be implemented with authentication system');
        }}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Logout (placeholder)"
      >
        <LogOut className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  );
}