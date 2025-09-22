
// src/app/api/qr/generate/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin'; // Sunucu tarafı için Firebase Admin SDK
import { db } from '@/lib/firebase'; // Firestore client SDK
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { headers } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export async function POST() {
  try {
    // 1. Kullanıcının kimliğini doğrula
    const authorization = headers().get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const { uid } = decodedToken;

    // 2. Benzersiz, tek kullanımlık bir token oluştur
    const qrToken = uuidv4();
    const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5 dakika geçerli

    // 3. Token'ı Firestore'a kaydet
    const tokenData = {
      token: qrToken,
      generatorUid: uid,
      createdAt: serverTimestamp(),
      expiresAt: expirationTime,
      isUsed: false,
      usedBy: null,
      usedAt: null,
    };

    const docRef = await addDoc(collection(db, 'qrTokens'), tokenData);

    console.log(`QR Token created for user ${uid}: ${qrToken}`);

    // 4. Oluşturulan token'ı ve geçerlilik süresini client'a gönder
    return NextResponse.json({
      token: qrToken,
      expiresAt: expirationTime.toISOString(),
      tokenId: docRef.id,
    });

  } catch (error) {
    console.error('Error generating QR token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
