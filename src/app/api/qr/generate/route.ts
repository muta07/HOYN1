import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { ownerId, redirectUrl, isPublic = false } = await request.json();

    if (!ownerId || !redirectUrl) {
      return NextResponse.json(
        { error: 'Owner ID and redirect URL are required' }, 
        { status: 400 }
      );
    }

    // Validate redirect URL
    try {
      new URL(redirectUrl);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid redirect URL' }, 
        { status: 400 }
      );
    }

    // Create QR code document
    const qrDocRef = await addDoc(collection(db, 'qrcodes'), {
      ownerId,
      redirectUrl,
      used: false,
      isPublic,
      createdAt: serverTimestamp(),
      lastScanBy: null,
      lastScanAt: null
    });

    return NextResponse.json({
      success: true,
      qrId: qrDocRef.id,
      message: 'QR code generated successfully'
    });

  } catch (error: any) {
    console.error('QR generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code: ' + error.message }, 
      { status: 500 }
    );
  }
}