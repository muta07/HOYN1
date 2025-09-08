import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/qr-utils';
import { getUserQRMode } from '@/lib/qr-modes';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Python QR generator script path
const PYTHON_SCRIPT = path.join(process.cwd(), 'hoyn_qr_sistemi', 'qr_uretici.py');

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' }, 
        { status: 400 }
      );
    }

    // Get user profile
    const profile = await getUserProfile(userId);
    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' }, 
        { status: 404 }
      );
    }

    // Get QR mode configuration
    const qrModeData = await getUserQRMode(userId);
    const qrMode = qrModeData ? qrModeData.mode : 'profile';

    // Prepare parameters for Python QR generator
    const username = profile.email ? profile.email.split('@')[0] : 'user';
    const profilId = profile.uid; // Use user ID as profil_id

    // Call Python QR generator
    const pythonCommand = `python "${PYTHON_SCRIPT}" "${username}" "${profilId}" "profile" "${qrMode}"`;
    
    const { stdout, stderr } = await execAsync(pythonCommand, {
      cwd: path.join(process.cwd(), 'hoyn_qr_sistemi'),
      timeout: 15000, // 15 second timeout for QR generation
      env: {
        ...process.env,
        PYTHONPATH: path.join(process.cwd(), 'hoyn_qr_sistemi')
      }
    });

    if (stderr) {
      console.error('Python QR generation stderr:', stderr);
    }

    // Parse Python output (base64 QR image)
    let qrBase64;
    try {
      // The Python script outputs "QR Base64: [data]..." 
      const match = stdout.match(/QR Base64: (.+)/);
      if (match) {
        qrBase64 = match[1].trim();
      } else {
        throw new Error('Invalid QR generation output');
      }
    } catch (parseError) {
      console.error('Failed to parse QR output:', parseError);
      return NextResponse.json(
        { error: 'QR generation failed', output: stdout }, 
        { status: 500 }
      );
    }

    // Update profile with QR data
    const updatedProfile = {
      ...profile,
      qrGenerated: true,
      qrMode: qrMode,
      qrBase64: qrBase64,
      qrGeneratedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to Firebase (this would be done in the frontend, but simulating here)
    // In real implementation, frontend would handle this
    console.log('Profile updated with QR data:', updatedProfile);

    return NextResponse.json({
      success: true,
      qrBase64: qrBase64,
      username: username,
      qrMode: qrMode,
      profile: updatedProfile
    });

  } catch (error: any) {
    console.error('QR generation API error:', error);
    
    if (error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM') {
      return NextResponse.json(
        { error: 'QR oluşturma zaman aşımına uğradı' }, 
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'QR oluşturma hatası: ' + error.message }, 
      { status: 500 }
    );
  }
}

// GET endpoint to check if QR exists for profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' }, 
        { status: 400 }
      );
    }

    // Get user profile to check QR status
    const profile = await getUserProfile(userId);
    
    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({
      qrGenerated: false, // Default value since this property doesn't exist on UserProfile
      qrMode: 'profile', // Default value since this property doesn't exist on UserProfile
      qrGeneratedAt: null, // Default value since this property doesn't exist on UserProfile
      username: profile.email ? profile.email.split('@')[0] : ''
    });

  } catch (error: any) {
    console.error('QR status API error:', error);
    return NextResponse.json(
      { error: 'QR durum kontrolü hatası: ' + error.message }, 
      { status: 500 }
    );
  }
}
