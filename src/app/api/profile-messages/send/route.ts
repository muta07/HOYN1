import { NextRequest, NextResponse } from 'next/server';
import { sendProfileMessage } from '@/lib/firebase';

// Simple in-memory rate limiting (in production, use Redis or Firestore)
const rateLimitStore = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000; // 5 minutes ago
  
  // Get timestamps for this IP
  let timestamps = rateLimitStore.get(ip) || [];
  
  // Filter out old timestamps
  timestamps = timestamps.filter(timestamp => timestamp > fiveMinutesAgo);
  
  // Check if limit exceeded (5 messages per 5 minutes)
  const isLimited = timestamps.length >= 5;
  
  // Update store
  rateLimitStore.set(ip, timestamps);
  
  return isLimited;
}

function recordMessageSend(ip: string) {
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  
  // Get timestamps for this IP
  let timestamps = rateLimitStore.get(ip) || [];
  
  // Filter out old timestamps
  timestamps = timestamps.filter(timestamp => timestamp > fiveMinutesAgo);
  
  // Add current timestamp
  timestamps.push(now);
  
  // Update store
  rateLimitStore.set(ip, timestamps);
}

export async function POST(request: NextRequest) {
  try {
    const { profileId, content, senderId, isAnonymous } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Basic validation
    if (!profileId || !content || content.length > 300 || content.length < 1) {
      return NextResponse.json({ error: 'Invalid request data: missing profileId or content (max 300 chars)' }, { status: 400 });
    }

    if (isAnonymous && content.length > 100) {
      return NextResponse.json({ error: 'Anonymous messages limited to 100 characters' }, { status: 400 });
    }

    // Rate limiting check
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many messages sent recently. Please wait before sending another message.' }, { status: 429 });
    }

    const success = await sendProfileMessage(profileId, content, senderId, isAnonymous);

    if (success) {
      // Record the message send for rate limiting
      recordMessageSend(ip);
      
      return NextResponse.json({ 
        success: true,
        message: 'Message sent successfully',
        timestamp: new Date().toISOString(),
        messageLength: content.length,
        isAnonymous
      });
    } else {
      return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in profile-messages/send API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
    }, { status: 500 });
  }
}