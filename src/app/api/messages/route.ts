import { NextRequest, NextResponse } from 'next/server';
import { getUserMessages, getUserConversations, getUserSettings, getUserDisplayName } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify userId format
    if (!userId.match(/^[a-zA-Z0-9_-]{28}$/)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 401 });
    }

    if (conversationId) {
      // Get specific conversation messages
      return await getConversationMessages(userId, conversationId, limit, page);
    } else {
      // Get all conversations and recent messages
      return await getUserInbox(userId, limit, page);
    }
  } catch (error) {
    console.error('Error in messages API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
    }, { status: 500 });
  }
}

async function getUserInbox(userId: string, limit: number, page: number) {
  try {
    const conversations = await getUserConversations(userId);
    const messages = await getUserMessages(userId);

    // Calculate total unread count
    const totalUnread = conversations.reduce((sum, conv) => {
      const unreadForUser = conv.unreadCounts?.[userId] || 0;
      return sum + unreadForUser;
    }, 0);

    // Process conversations for display
    const processedConversations = await Promise.all(
      conversations.map(async (conv) => {
        let displayName = '';
        let avatarUrl = '';
        let isAnonymous = false;

        if (conv.isAnonymousThread) {
          displayName = 'Anonymous';
          isAnonymous = true;
          avatarUrl = '/api/placeholder/40/40'; // Generic anonymous avatar
        } else {
          // Find the other participant
          const otherParticipant = conv.participants.find(id => id !== userId);
          if (otherParticipant) {
            displayName = await getUserDisplayName(otherParticipant);
            // Get user avatar (would need to fetch from users collection)
            // avatarUrl = await getUserAvatar(otherParticipant);
            avatarUrl = '/api/placeholder/40/40';
          }
        }

        const unreadCount = conv.unreadCounts?.[userId] || 0;
        // Handle lastUpdated as either Date or Firestore timestamp
        let lastMessageTime = 0;
        if (conv.lastUpdated) {
          if (conv.lastUpdated instanceof Date) {
            lastMessageTime = conv.lastUpdated.getTime();
          } else if (conv.lastUpdated && typeof (conv.lastUpdated as any).toDate === 'function') {
            lastMessageTime = (conv.lastUpdated as any).toDate().getTime();
          } else {
            lastMessageTime = new Date(conv.lastUpdated).getTime();
          }
        }

        return {
          id: conv.id,
          displayName,
          avatarUrl,
          lastMessage: conv.lastMessage || '',
          lastUpdated: lastMessageTime,
          unreadCount,
          isAnonymous,
          participantCount: conv.participants.length,
          isAnonymousThread: conv.isAnonymousThread || false
        };
      })
    );

    // Sort conversations by last updated
    const sortedConversations = processedConversations.sort((a, b) => b.lastUpdated - a.lastUpdated);

    // Get recent messages for preview (last 5 from each conversation)
    const recentMessages = messages
      .sort((a, b) => (b.timestamp as any).toDate().getTime() - (a.timestamp as any).toDate().getTime())
      .slice(0, 20);

    // Get user settings for messaging preferences
    const settings = await getUserSettings(userId);

    return NextResponse.json({
      success: true,
      conversations: sortedConversations.slice((page - 1) * limit, page * limit),
      totalConversations: sortedConversations.length,
      totalPages: Math.ceil(sortedConversations.length / limit),
      recentMessages,
      totalUnread,
      settings: {
        canReceiveMessages: settings?.canReceiveMessages ?? true,
        canReceiveAnonymous: settings?.canReceiveAnonymous ?? true
      },
      currentPage: page,
      limit,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting user inbox:', error);
    throw error;
  }
}

async function getConversationMessages(userId: string, conversationId: string, limit: number, page: number) {
  try {
    // First, verify user can access this conversation
    const conversations = await getUserConversations(userId);
    const conversation = conversations.find(conv => conv.id === conversationId);
    
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 403 });
    }

    // Get all messages for this conversation
    const allMessages = await getUserMessages(userId);
    const conversationMessages = allMessages.filter(msg => {
      // For now, filter by sender/recipient - would need to be updated for conversation structure
      return msg.senderId === conversationId || msg.recipientId === conversationId;
    });

    // Sort messages by timestamp (newest first)
    const sortedMessages = conversationMessages
      .sort((a, b) => (b.timestamp as any).toDate().getTime() - (a.timestamp as any).toDate().getTime())
      .slice((page - 1) * limit, page * limit);

    // Mark messages as read for this user
    // This would be implemented with markMessageAsRead function
    // await markMessageAsRead(conversationId, '', userId);

    // Get conversation details
    let displayName = '';
    let isAnonymous = false;
    
    if (conversation.isAnonymousThread) {
      displayName = 'Anonymous';
      isAnonymous = true;
    } else {
      const otherParticipant = conversation.participants.find(id => id !== userId);
      if (otherParticipant) {
        displayName = await getUserDisplayName(otherParticipant);
      }
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversationId,
        displayName,
        isAnonymous,
        participants: conversation.participants,
        lastMessage: conversation.lastMessage,
        unreadCount: 0 // Reset after viewing
      },
      messages: sortedMessages.map(msg => ({
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        recipientId: msg.recipientId,
        text: msg.text,
        timestamp: msg.timestamp,
        isRead: msg.isRead ?? false,
        isAnonymous: msg.senderId === null
      })),
      totalMessages: conversationMessages.length,
      totalPages: Math.ceil(conversationMessages.length / limit),
      currentPage: page,
      limit,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    throw error;
  }
}
