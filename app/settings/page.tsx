'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/app/theme-provider';
import { Settings, Sun, Moon, Check, Save } from 'lucide-react';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState('appearance');
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your application preferences
        </p>
      </div>

      <div className="flex gap-6">
        <div className="w-64">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveSection('appearance')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'appearance'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-l-2 border-blue-500'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Appearance
            </button>
            <button
              onClick={() => setActiveSection('general')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'general'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-l-2 border-blue-500'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              General
            </button>
          </nav>
        </div>

        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            {activeSection === 'appearance' && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Appearance Settings
                  </h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Theme
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {themeOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = mounted && theme === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => {
                              if (theme !== option.value) {
                                toggleTheme();
                              }
                            }}
                            disabled={!mounted}
                            className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            } ${!mounted ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <Check className="w-4 h-4 text-blue-500" />
                              </div>
                            )}
                            <Icon className={`w-6 h-6 ${
                              isSelected 
                                ? 'text-blue-500' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                              isSelected
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {option.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Choose your preferred color scheme.
                    </p>
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Preview
                    </h3>
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-blue-500"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="h-20 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"></div>
                          <div className="h-20 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"></div>
                          <div className="h-20 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'general' && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    General Settings
                  </h2>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  General settings will be available here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}