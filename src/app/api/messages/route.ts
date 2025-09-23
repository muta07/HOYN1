
// src/app/api/messages/route.ts
import { NextResponse } from 'next/server';
import { auth, firestore } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, orderBy } from 'firebase/firestore';
import { headers } from 'next/headers';

// GET: Kullanıcının aldığı mesajları listeler
export async function GET(request: Request) {
    try {
        // Firebase Admin'in başlatılıp başlatılmadığını kontrol et
        if (!auth || !firestore) {
            console.error('Firebase Admin is not initialized');
            return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
        }

        // 1. Kullanıcı kimliğini doğrula
        const authorization = headers().get('Authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const idToken = authorization.split('Bearer ')[1];
        
        let decodedToken;
        try {
            decodedToken = await auth.verifyIdToken(idToken);
        } catch (error) {
            console.error('Error verifying token:', error);
            return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
        }
        
        const recipientUid = decodedToken.uid;

        // 2. Firestore'dan mesajları al
        const messagesRef = collection(firestore as any, 'messages');
        const q = query(
            messagesRef, 
            where('recipientUid', '==', recipientUid),
            orderBy('timestamp', 'desc') // En yeni mesajlar üstte
        );
        
        const querySnapshot = await getDocs(q);
        const messages = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Timestamp nesnesini okunabilir bir formata çevir
            timestamp: doc.data().timestamp.toDate().toISOString(),
        }));

        return NextResponse.json(messages);

    } catch (error: any) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Yeni bir mesaj gönderir (hem normal hem anonim)
export async function POST(request: Request) {
    try {
        // Firebase Admin'in başlatılıp başlatılmadığını kontrol et
        if (!auth || !firestore) {
            console.error('Firebase Admin is not initialized');
            return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
        }

        const { recipientUsername, content, isAnonymous } = await request.json();

        if (!recipientUsername || !content) {
            return NextResponse.json({ error: 'Recipient username and content are required' }, { status: 400 });
        }

        let senderUid: string | null = null;
        let senderDisplayName: string | null = 'Anonymous';

        // 1. Gönderenin kimliğini doğrula (eğer anonim değilse)
        if (!isAnonymous) {
            const authorization = headers().get('Authorization');
            if (!authorization?.startsWith('Bearer ')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            const idToken = authorization.split('Bearer ')[1];
            
            let decodedToken;
            try {
                decodedToken = await auth.verifyIdToken(idToken);
            } catch (error) {
                console.error('Error verifying token:', error);
                return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
            }
            
            senderUid = decodedToken.uid;
            senderDisplayName = decodedToken.name || decodedToken.email || 'Kullanıcı';
        }

        // 2. Alıcının UID'sini kullanıcı adına göre bul
        // Önce Firestore'daki 'profiles' koleksiyonundan username ile arama yap
        const profilesRef = collection(firestore as any, 'profiles');
        const q = query(profilesRef, where('username', '==', recipientUsername));
        const profileSnapshot = await getDocs(q);

        if (profileSnapshot.empty) {
            return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
        }
        const recipientProfile = profileSnapshot.docs[0].data();
        const recipientUid = recipientProfile.ownerUid || recipientProfile.uid; // Yeni ve eski model uyumluluğu

        // 3. Mesajı Firestore'a kaydet
        const messageData = {
            senderUid,
            senderDisplayName, // Anonim olmayan mesajlarda gönderenin adını göstermek için
            recipientUid,
            content,
            isAnonymous,
            isRead: false,
            timestamp: serverTimestamp(),
        }

        await addDoc(collection(firestore as any, 'messages'), messageData);

        return NextResponse.json({ success: true, message: 'Message sent successfully!' });

    } catch (error: any) {
        console.error('Error sending message:', error);
        // Firebase Auth'un `user-not-found` hatasını yakala
        if (error.code === 'auth/user-not-found') {
            return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
