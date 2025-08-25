'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeIndicator() {
  const { theme } = useTheme();
  const [actualTheme, setActualTheme] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Check what theme is actually applied
    const root = window.document.documentElement;
    const isDark = root.classList.contains('dark');
    const isLight = root.classList.contains('light');
    
    if (isDark) {
      setActualTheme('dark');
    } else if (isLight) {
      setActualTheme('light');
    } else {
      setActualTheme('none');
    }
  }, [theme, mounted]);

  if (!mounted) return null;

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'system':
        return <Monitor className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getActualThemeColor = () => {
    switch (actualTheme) {
      case 'dark':
        return 'text-blue-400 bg-gray-800';
      case 'light':
        return 'text-orange-500 bg-white';
      default:
        return 'text-gray-500 bg-gray-200';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        {getIcon()}
        <div className="text-xs">
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            Mode: {theme}
          </div>
          <div className={`font-mono ${getActualThemeColor()}`}>
            Applied: {actualTheme || 'detecting...'}
          </div>
        </div>
      </div>
      <div className="ml-2 px-2 py-1 rounded text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
        {typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'System: dark' : 'System: light'}
      </div>
    </div>
  );
}