// src/app/api/test-firebase/route.ts
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function GET() {
  try {
    console.log('API Route: Testing Firebase connection');
    
    if (!db) {
      console.log('API Route: Firebase not initialized');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Firebase not initialized',
          db: false
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('API Route: Firebase initialized, testing connection');
    
    // Try to access a collection to test connection
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    
    console.log('API Route: Firebase connection successful');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Firebase connection successful',
        db: true,
        docCount: snapshot.size
      }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('API Route: Firebase connection error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Firebase connection error',
        error: error.message || 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}