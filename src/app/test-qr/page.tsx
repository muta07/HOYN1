// src/app/test-qr/page.tsx
'use client';

import { useState } from 'react';
import ClientQRGenerator from '@/components/qr/ClientQRGenerator';

export default function TestQRPage() {
  const [url, setUrl] = useState('https://example.com/u/testuser');
  
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">QR Code Test</h1>
        
        <div className="mb-8">
          <label className="block mb-2">URL to encode:</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4"
          />
        </div>
        
        <div className="flex justify-center">
          <div className="p-8 bg-white rounded-xl">
            <ClientQRGenerator 
              value={url} 
              size={256}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-gray-900 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Scan the QR code above with your phone's camera or a QR scanner app</li>
            <li>Check if it redirects to the correct URL</li>
            <li>If it doesn't work, try changing the URL in the input field above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}