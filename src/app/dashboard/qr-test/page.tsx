// src/app/dashboard/qr-test/page.tsx
'use client';

import QRTestValidation from '@/components/qr/QRTestValidation';

export default function QRTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 glow-text">
            🧪 QR <span className="text-purple-400">Performance Test</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Validate that QR generation meets acceptance criteria: 
            sub-1-second generation, always-working downloads, and professional performance.
          </p>
        </div>

        {/* Test Component */}
        <QRTestValidation />
      </div>
    </div>
  );
}