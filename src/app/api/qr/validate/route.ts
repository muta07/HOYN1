import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export async function POST(request: NextRequest) {
  // Check if Firebase is initialized
  if (!db) {
    return NextResponse.json(
      { error: 'Firebase is not initialized' }, 
      { status: 500 }
    );
  }
  
  try {
    const { qrId } = await request.json();

    if (!qrId) {
      return NextResponse.json(
        { error: 'QR ID is required' }, 
        { status: 400 }
      );
    }

    // Get the QR code document
    const qrDocRef = doc(db, 'qrcodes', qrId);
    const qrDoc = await getDoc(qrDocRef);

    if (!qrDoc.exists()) {
      return NextResponse.json(
        { error: 'QR code not found' }, 
        { status: 404 }
      );
    }

    const qrData = qrDoc.data();

    // Check if QR code is already used
    if (qrData.used) {
      return NextResponse.json(
        { 
          error: 'This QR code has already been used',
          type: 'already_used'
        }, 
        { status: 400 }
      );
    }

    // Get user ID from auth token
    const authHeader = request.headers.get('authorization');
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // In a real implementation, you would verify the token here
      // For now, we'll just extract it for logging purposes
      userId = 'anonymous'; // Placeholder
    }

    // Update QR code as used
    await updateDoc(qrDocRef, {
      used: true,
      lastScanBy: userId,
      lastScanAt: serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      redirectUrl: qrData.redirectUrl,
      message: 'QR code validated successfully'
    });

  } catch (error: any) {
    console.error('QR validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate QR code: ' + error.message }, 
      { status: 500 }
    );
  }
}