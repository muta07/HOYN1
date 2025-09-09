import { NextResponse } from 'next/server';
import { firestoreAdmin } from '@/lib/firebase-admin';
import { Profile } from '@/lib/firebase'; // Reuse the Profile interface

// Revalidate every 60 seconds
export const revalidate = 60;

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    if (!slug) {
      return new NextResponse('Slug parameter is missing', { status: 400 });
    }

    const profilesRef = firestoreAdmin.collection('profiles');
    const query = profilesRef.where('slug', '==', slug);
    const snapshot = await query.get();

    if (snapshot.empty) {
      // For consistency, we can return a default structure or a specific message
      return new NextResponse(JSON.stringify({ error: 'Profile not found' }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const profileDoc = snapshot.docs[0];
    const profileData = profileDoc.data() as Profile;

    // Firestore Timestamps are not directly serializable to JSON for client components.
    // We need to convert them to a string or number.
    const serializedProfile = {
      ...profileData,
      id: profileDoc.id,
      createdAt: profileData.createdAt ? (profileData.createdAt as any).toDate().toISOString() : null,
      updatedAt: profileData.updatedAt ? (profileData.updatedAt as any).toDate().toISOString() : null,
    };

    return NextResponse.json(serializedProfile);

  } catch (error) {
    console.error(`[API_PROFILE_GET_BY_SLUG]`, error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
