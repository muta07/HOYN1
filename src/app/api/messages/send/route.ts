import { NextRequest, NextResponse } from 'next/server';
import { getUserSettings, sendMessage, sendAnonymousMessage } from '@/lib/firebase';

// Simple in-memory rate limiting (in production, use Redis or Firestore)
const rateLimitStore = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000; // 5 minutes ago
  
  // Get timestamps for this user
  let timestamps = rateLimitStore.get(userId) || [];
  
  // Filter out old timestamps
  timestamps = timestamps.filter(timestamp => timestamp > fiveMinutesAgo);
  
  // Check if limit exceeded (5 messages per 5 minutes)
  const isLimited = timestamps.length >= 5;
  
  // Update store
  rateLimitStore.set(userId, timestamps);
  
  return isLimited;
}

function recordMessageSend(userId: string) {
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  
  // Get timestamps for this user
  let timestamps = rateLimitStore.get(userId) || [];
  
  // Filter out old timestamps
  timestamps = timestamps.filter(timestamp => timestamp > fiveMinutesAgo);
  
  // Add current timestamp
  timestamps.push(now);
  
  // Update store
  rateLimitStore.set(userId, timestamps);
}

export async function POST(request: NextRequest) {
  try {
    const { userId, recipientId, text, isAnonymous, senderName } = await request.json();
    
    // Basic validation
    if (!userId || !recipientId || !text || text.length > 300 || text.length < 1) {
      return NextResponse.json({ error: 'Invalid request data: missing userId, recipientId, or text (max 300 chars)' }, { status: 400 });
    }

    // Verify the userId is a valid Firebase UID format (simple check)
    if (!userId.match(/^[a-zA-Z0-9_-]{28}$/)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 401 });
    }

    if (isAnonymous && text.length > 100) {
      return NextResponse.json({ error: 'Anonymous messages limited to 100 characters' }, { status: 400 });
    }

    // Rate limiting check
    if (isRateLimited(userId)) {
      return NextResponse.json({ error: 'Too many messages sent recently. Please wait before sending another message.' }, { status: 429 });
    }

    let success: boolean;
    
    if (isAnonymous) {
      // Check if recipient allows anonymous messages
      const settings = await getUserSettings(recipientId);
      if (!settings?.canReceiveAnonymous) {
        return NextResponse.json({ error: 'Recipient has disabled anonymous messages' }, { status: 403 });
      }
      
      success = await sendAnonymousMessage(recipientId, text);
    } else {
      // Check if recipient allows messages
      const settings = await getUserSettings(recipientId);
      if (!settings?.canReceiveMessages) {
        return NextResponse.json({ error: 'Recipient has disabled messages' }, { status: 403 });
      }
      
      success = await sendMessage(userId, recipientId, text, senderName);
    }

    if (success) {
      // Record the message send for rate limiting
      recordMessageSend(userId);
      
      const conversationId = isAnonymous ? `${recipientId}_anonymous` : `conv_${[userId, recipientId].sort().join('_')}`;
      
      return NextResponse.json({ 
        success: true,
        message: 'Message sent successfully',
        timestamp: new Date().toISOString(),
        conversationId,
        messageLength: text.length,
        isAnonymous
      });
    } else {
      return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in messages/send API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
    }, { status: 500 });
  }
}