
// src/app/api/messages/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, orderBy } from 'firebase/firestore';
import { headers } from 'next/headers';

// GET: Kullanıcının aldığı mesajları listeler
export async function GET(request: Request) {
    try {
        // 1. Kullanıcı kimliğini doğrula
        const authorization = headers().get('Authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const idToken = authorization.split('Bearer ')[1];
        const decodedToken = await auth.verifyIdToken(idToken);
        const recipientUid = decodedToken.uid;

        // 2. Firestore'dan mesajları al
        const messagesRef = collection(db, 'messages');
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

    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Yeni bir mesaj gönderir (hem normal hem anonim)
export async function POST(request: Request) {
    try {
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
            const decodedToken = await auth.verifyIdToken(idToken);
            senderUid = decodedToken.uid;
            senderDisplayName = decodedToken.name || decodedToken.email || 'Kullanıcı';
        }

        // 2. Alıcının UID'sini kullanıcı adına göre bul
        const userRecord = await auth.getUserByEmail(`${recipientUsername}@hoyn.app`); // Bu kısım sizin kullanıcı adı yapınıza göre değişebilir.
        // Alternatif: Firestore'daki 'profiles' koleksiyonundan username ile arama yapın.
        const profilesRef = collection(db, 'profiles');
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
        };

        await addDoc(collection(db, 'messages'), messageData);

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
