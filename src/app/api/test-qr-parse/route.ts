// src/app/api/test-qr-parse/route.ts
import { parseHOYNQR } from '@/lib/qr-utils';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { qrData } = await request.json();
    
    // Try to parse as HOYN QR
    const parsedData = parseHOYNQR(qrData);
    
    if (parsedData) {
      return NextResponse.json({
        success: true,
        parsedData,
        message: 'QR code parsed successfully'
      });
    }
    
    // Try to parse as regular URL
    try {
      if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
        const url = new URL(qrData);
        return NextResponse.json({
          success: true,
          parsedData: {
            type: 'url',
            url: qrData,
            hostname: url.hostname,
            pathname: url.pathname
          },
          message: 'URL parsed successfully'
        });
      }
    } catch (urlError) {
      // Not a valid URL
    }
    
    return NextResponse.json({
      success: false,
      error: 'Could not parse QR data',
      qrData
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to parse QR data',
      message: (error as Error).message
    });
  }
}