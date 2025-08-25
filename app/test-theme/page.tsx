'use client';

import { useEffect, useState } from 'react';

export default function TestThemePage() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      const html = document.documentElement;
      setIsDark(html.classList.contains('dark'));
    };

    checkTheme();

    // Watch for changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const toggleDark = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
    } else {
      html.classList.add('dark');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-gray-100">
        Theme Test Page
      </h1>
      
      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Current State: {isDark ? 'DARK MODE' : 'LIGHT MODE'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            HTML classes: {typeof window !== 'undefined' ? document.documentElement.className : 'Loading...'}
          </p>
        </div>

        <button
          onClick={toggleDark}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Manual Toggle Dark Class
        </button>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-black text-black dark:text-white border-2 border-gray-300 dark:border-gray-600 rounded-lg">
            <h3 className="font-bold mb-2">Box 1</h3>
            <p>Should be white in light, black in dark</p>
          </div>
          
          <div className="p-4 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-2 border-gray-300 dark:border-gray-600 rounded-lg">
            <h3 className="font-bold mb-2">Box 2</h3>
            <p>Should be light gray in light, dark gray in dark</p>
          </div>
          
          <div className="p-4 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
            <h3 className="font-bold mb-2">Box 3</h3>
            <p>Should be light blue in light, dark blue in dark</p>
          </div>
          
          <div className="p-4 bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 border-2 border-green-300 dark:border-green-700 rounded-lg">
            <h3 className="font-bold mb-2">Box 4</h3>
            <p>Should be light green in light, dark green in dark</p>
          </div>
        </div>
      </div>
    </div>
  );
}