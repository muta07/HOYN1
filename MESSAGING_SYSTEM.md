# HOyN Messaging System Implementation

## Overview

This document explains the implementation of the new messaging system for HOyN, which allows visitors to send messages to profile owners in two modes:
1. Normal Message - with sender's profile attached
2. Anonymous Message - no sender info, only "Anonymous"

## Database Structure

The messaging system uses the following database structure:

```
profiles/{profileId}/messages/{messageId} {
  content: string,
  senderId: string | null, // null if anonymous
  isAnonymous: boolean,
  timestamp: serverTimestamp(),
  replied: boolean,
  replyContent: string | null
}
```

## Firebase Security Rules

The Firestore security rules have been updated to:
- Allow anyone to send messages to a profile (write-only)
- Only allow profile owners to read messages under their profile
- Only allow profile owners to reply to messages
- Enforce message content limits (100 chars for anonymous, 300 for normal)

## Backend Implementation

### Firebase Functions

New functions added to `src/lib/firebase.ts`:

1. `sendProfileMessage` - Sends a message to a profile
2. `replyToProfileMessage` - Replies to a received message
3. `getProfileMessages` - Retrieves messages for a profile
4. `onProfileMessagesSnapshot` - Real-time listener for profile messages

### API Routes

New API route created at `src/app/api/profile-messages/send/route.ts`:
- Handles message sending with rate limiting
- Validates message content and size
- Prevents spam with IP-based throttling

## Frontend Implementation

### Components

1. `ProfileMessageSender` - Component for sending messages from profile pages
   - Modal interface with message textbox
   - Anonymous toggle switch
   - Character limit enforcement

2. `ProfileMessagesPage` - Dashboard page for viewing and replying to messages
   - Profile selection sidebar
   - Message display with chat bubbles
   - Reply functionality for non-anonymous messages
   - Real-time updates with Firestore listeners

### UI Features

- Neon-styled chat bubbles with purple/white theme
- Anonymous messages show "👻 Anonymous" avatar
- Normal messages show "👤 Visitor" avatar
- Mobile-responsive design
- Real-time message updates
- Reply functionality for profile owners

## Spam Prevention

- Rate limiting: Maximum 5 messages per 5 minutes per IP
- Character limits: 100 chars for anonymous, 300 for normal messages
- Server-side validation of all message data

## Error Handling

- Empty message validation
- Firebase write failure handling
- User-friendly error messages
- Retry mechanisms for failed operations

## Integration Points

### Profile Pages

The `ProfileMessageSender` component is integrated into profile pages (`src/app/p/[slug]/page.tsx`) for visitors to send messages.

### Dashboard

The new `ProfileMessagesPage` is accessible from the main messages dashboard and provides profile owners with a complete messaging interface.

## Testing

A test page is available at `/dashboard/messages/test-profile-messaging` to verify the messaging functionality with custom profile IDs.