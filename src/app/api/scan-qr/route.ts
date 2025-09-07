import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Python backend script path
const PYTHON_SCRIPT = path.join(process.cwd(), 'hoyn_qr_sistemi', 'qr_tarayici.py');

export async function POST(request: NextRequest) {
  try {
    const { qrData } = await request.json();

    if (!qrData) {
      return NextResponse.json(
        { error: 'QR data is required' }, 
        { status: 400 }
      );
    }

    // Call Python backend for QR validation
    const pythonCommand = `python "${PYTHON_SCRIPT}"`;
    
    // Pass QR data as command line argument
    const fullCommand = `${pythonCommand} "${qrData}"`;
    
    const { stdout, stderr } = await execAsync(fullCommand, {
      cwd: path.join(process.cwd(), 'hoyn_qr_sistemi'),
      timeout: 10000, // 10 second timeout
      env: {
        ...process.env,
        PYTHONPATH: path.join(process.cwd(), 'hoyn_qr_sistemi')
      }
    });

    if (stderr) {
      console.error('Python stderr:', stderr);
    }

    // Parse Python output (JSON response)
    let result;
    try {
      result = JSON.parse(stdout.trim());
    } catch (parseError) {
      console.error('Failed to parse Python response:', parseError);
      console.log('Raw Python output:', stdout);
      return NextResponse.json(
        { error: 'QR validation failed', result: stdout }, 
        { status: 500 }
      );
    }

    // Map Python response to frontend format
    if (result.sonuc === 'basarili') {
      // Successful HOYN QR - extract profile info
      return NextResponse.json({
        success: true,
        isHOYN: true,
        type: 'profile',
        username: result.profil_bilgisi?.kullanici_id || result.profil_bilgisi?.username,
        profileId: result.profil_bilgisi?.profil_id,
        message: result.mesaj,
        data: result.profil_bilgisi
      });
    } else if (result.sonuc === 'uyari' && result.mesaj.includes('Hoyn QR Tarayıcı')) {
      // Third-party scanner warning
      return NextResponse.json({
        success: false,
        isHOYN: true,
        type: 'third_party_warning',
        message: result.mesaj,
        requiresHOYNScanner: true
      });
    } else if (result.sonuc === 'uyari') {
      // Non-HOYN QR scanned with HOYN scanner
      return NextResponse.json({
        success: false,
        isHOYN: false,
        type: 'non_hoyn',
        message: result.mesaj,
        rawData: qrData
      });
    } else {
      // Validation error
      return NextResponse.json({
        success: false,
        isHOYN: false,
        type: 'invalid',
        message: result.mesaj || 'QR kodu geçersiz',
        error: result.sonuc
      });
    }

  } catch (error: any) {
    console.error('QR scan API error:', error);
    
    if (error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM') {
      return NextResponse.json(
        { error: 'QR doğrulama zaman aşımına uğradı' }, 
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'QR tarama hatası: ' + error.message }, 
      { status: 500 }
    );
  }
};

// Simple GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'HOYN QR Scan API - POST /api/scan-qr ile QR doğrulama yapın',
    expectedFormat: {
      qrData: 'string' // Raw QR code data
    },
    endpoints: {
      POST: '/api/scan-qr',
      method: 'POST',
      body: { qrData: '...' }
    }
  });
}