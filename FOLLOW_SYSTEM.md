# HOyN Profile-Based Follow System Implementation

## Overview

This document explains the implementation of the profile-based follow system for HOyN, which allows users to follow/unfollow specific profiles rather than just users. Each profile maintains its own followers and following lists.

## Database Structure

The follow system uses the following database structure:

```
profiles/{profileId}/followers/{followerId} {
  followerId: string,
  followerProfileId: string,
  followedAt: serverTimestamp()
}

profiles/{profileId}/following/{followingId} {
  followingProfileId: string,
  followedAt: serverTimestamp()
}
```

## Firebase Security Rules

The Firestore security rules have been updated to:
- Allow authenticated users to follow profiles (write-only)
- Restrict reading of full followers/following lists to profile owners only
- Prevent duplicate follows
- Ensure data integrity with no updates or deletes allowed

## Backend Implementation

### Firebase Functions

New functions added to `src/lib/firebase.ts`:

1. `followProfile` - Follows a profile
2. `unfollowProfile` - Unfollows a profile
3. `isProfileFollowing` - Checks if a user is following a profile
4. `getProfileFollowersCount` - Gets the count of followers for a profile
5. `getProfileFollowingCount` - Gets the count of profiles a user is following
6. `onProfileFollowersSnapshot` - Real-time listener for profile followers
7. `onProfileFollowingSnapshot` - Real-time listener for profile following

## Frontend Implementation

### Components

1. `ProfileFollowButton` - Component for following/unfollowing profiles
   - Shows "Follow" or "Following" state
   - Handles follow/unfollow actions
   - Real-time state updates

2. `ProfileStats` - Component for displaying follow statistics
   - Shows followers and following counts
   - Provides real-time updates
   - Clickable to view lists

3. `ProfileFollowList` - Modal component for displaying followers/following
   - Lists followers or following with profile information
   - Includes profile avatars and names
   - Mobile-responsive design

### UI Features

- Neon-styled follow button with purple/pink theme
- Real-time follower/following counts
- Modal lists for followers and following
- Mobile-responsive design with slide-up modals
- Profile avatars and names in list views

## Integration Points

### Profile Pages

The follow system is integrated into profile pages (`src/app/p/[slug]/page.tsx`) where visitors can:
- Follow/unfollow profiles
- View follower/following counts
- Click counts to view detailed lists

## Privacy

- Only profile owners can view their complete followers/following lists
- Follow actions are authenticated user-only
- No personal information is exposed in the follow data

## Testing

The follow system has been implemented with real-time updates and proper error handling. All components are ready for use in the HOyN application.