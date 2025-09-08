import { NextRequest, NextResponse } from 'next/server';
import { getProfileBySlug, getProfileById, incrementProfileScans } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { qrData, profileId } = await request.json();

    if (!qrData) {
      return NextResponse.json(
        { error: 'QR data is required' }, 
        { status: 400 }
      );
    }

    // Log scan analytics
    console.log('QR Scan tracked:', {
      qrData: qrData.substring(0, 50) + '...',
      profileId,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      ip: request.ip || 'unknown'
    });

    // Parse QR data to extract profile info (for validation)
    let extractedSlug = null;
    let extractedProfileId = null;
    
    try {
      const url = new URL(qrData);
      
      // Check for new format: /p/{slug}
      if (url.pathname.startsWith('/p/')) {
        extractedSlug = url.pathname.split('/p/')[1].split('?')[0];
      }
      // Check for old format: /u/{profileId}
      else if (url.pathname.startsWith('/u/')) {
        extractedProfileId = url.pathname.split('/u/')[1].split('?')[0];
      }
    } catch (e) {
      console.log('QR data is not a valid URL');
    }

    // Validate that the QR contains a valid HOYN profile URL
    if (!extractedSlug && !extractedProfileId) {
      return NextResponse.json({
        success: false,
        isHOYN: false,
        type: 'invalid',
        message: 'Invalid QR Code. Please generate with HOyN app.',
        rawData: qrData
      }, { status: 400 });
    }

    // Try to find the profile
    let profile = null;
    
    // First try by slug (new format)
    if (extractedSlug) {
      profile = await getProfileBySlug(extractedSlug);
    }
    
    // If not found and we have profileId, try old format
    if (!profile && extractedProfileId) {
      profile = await getProfileById(extractedProfileId);
    }
    
    // If still no profile found, it's either invalid or deleted
    if (!profile) {
      return NextResponse.json({
        success: false,
        isHOYN: true,
        type: 'not_found',
        message: 'This profile no longer exists.',
        qrData: qrData
      }, { status: 404 });
    }

    // Increment profile scans counter
    try {
      await incrementProfileScans(profile.id);
    } catch (error) {
      console.error('Failed to increment profile scans:', error);
    }

    return NextResponse.json({
      success: true,
      isHOYN: true,
      type: 'profile',
      profileId: profile.id,
      slug: profile.slug,
      message: 'QR scan validated successfully',
      data: {
        qrData,
        profileId: profile.id,
        slug: profile.slug,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('QR scan API error:', error);
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
      qrData: 'string',
      profileId: 'string (optional)'
    },
    endpoints: {
      POST: '/api/scan-qr',
      method: 'POST',
      body: { qrData: 'https://hoyn.app/u/profile123' }
    }
  });
};