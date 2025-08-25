'use client';

import { useTheme } from '@/app/theme-provider';
import { Moon, Sun } from 'lucide-react';

export function ThemeButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-4 left-4 z-50 p-3 rounded-full shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-gray-700" />
      )}
    </button>
  );
}