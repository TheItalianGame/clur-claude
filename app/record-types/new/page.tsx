'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RecordTypeBuilder from '@/components/records/RecordTypeBuilder';
import { ArrowLeft } from 'lucide-react';

export default function NewRecordTypePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // The RecordTypeBuilder component handles the actual save
    setTimeout(() => {
      router.push('/record-types');
    }, 500);
  };

  const handleCancel = () => {
    router.push('/record-types');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Create New Record Type
        </h1>
        
        <RecordTypeBuilder
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}