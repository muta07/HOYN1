// src/lib/social.ts
import { 
  doc, 
  collection, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  updateDoc,
  increment,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

export interface FollowRelation {
  id?: string;
  followerId: string;    // User who follows
  followingId: string;   // User being followed
  createdAt: Date;
  followerUsername: string;
  followingUsername: string;
}

export interface SocialStats {
  followersCount: number;
  followingCount: number;
}

export interface ActivityItem {
  id?: string;
  userId: string;
  username: string;
  displayName: string;
  action: 'profile_update' | 'new_qr' | 'joined' | 'business_update';
  description: string;
  createdAt: Date;
  metadata?: {
    profileUrl?: string;
    qrMode?: string;
    businessType?: string;
  };
}

// Follow a user
export async function followUser(
  currentUserId: string,
  targetUserId: string,
  currentUsername: string,
  targetUsername: string
): Promise<boolean> {
  // Check if Firebase is initialized
  if (!db) {
    console.warn('Firebase is not initialized. Cannot follow user.');
    return false;
  }

  try {
    const isAlreadyFollowing = await isFollowing(currentUserId, targetUserId);
    if (isAlreadyFollowing) {
      throw new Error('Already following this user');
    }

    const batch = writeBatch(db);

    // Add follow relation
    const followsRef = collection(db, 'follows');
    const newFollowRef = doc(followsRef);
    batch.set(newFollowRef, {
      followerId: currentUserId,
      followingId: targetUserId,
      followerUsername: currentUsername,
      followingUsername: targetUsername,
      createdAt: new Date()
    });

    // Update follower's following count
    const followerRef = doc(db, 'users', currentUserId);
    batch.update(followerRef, {
      followingCount: increment(1)
    });

    // Update target's followers count
    const targetRef = doc(db, 'users', targetUserId);
    batch.update(targetRef, {
      followersCount: increment(1)
    });

    await batch.commit();

    // Add activity for followers
    await addActivity({
      userId: currentUserId,
      username: currentUsername,
      displayName: currentUsername, // Will be updated if we have display name
      action: 'profile_update',
      description: `${targetUsername} kullanıcısını takip etmeye başladı`,
      createdAt: new Date(),
      metadata: {
        profileUrl: `/u/${targetUsername}`
      }
    });

    return true;
  } catch (error) {
    console.error('Error following user:', error);
    return false;
  }
}

// Unfollow a user
export async function unfollowUser(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  // Check if Firebase is initialized
  if (!db) {
    console.warn('Firebase is not initialized. Cannot unfollow user.');
    return false;
  }

  try {
    // Find the follow relation
    const followsRef = collection(db, 'follows');
    const q = query(
      followsRef,
      where('followerId', '==', currentUserId),
      where('followingId', '==', targetUserId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Follow relation not found');
    }

    const batch = writeBatch(db);

    // Delete follow relation
    querySnapshot.forEach((docSnapshot) => {
      batch.delete(doc(db, 'follows', docSnapshot.id));
    });

    // Update follower's following count
    const followerRef = doc(db, 'users', currentUserId);
    batch.update(followerRef, {
      followingCount: increment(-1)
    });

    // Update target's followers count
    const targetRef = doc(db, 'users', targetUserId);
    batch.update(targetRef, {
      followersCount: increment(-1)
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return false;
  }
}

// Check if user is following another user
export async function isFollowing(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  // Check if Firebase is initialized
  if (!db) {
    console.warn('Firebase is not initialized. Cannot check follow status.');
    return false;
  }

  try {
    const followsRef = collection(db, 'follows');
    const q = query(
      followsRef,
      where('followerId', '==', currentUserId),
      where('followingId', '==', targetUserId)
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
}

// Get user's followers
export async function getFollowers(userId: string): Promise<FollowRelation[]> {
  // Check if Firebase is initialized
  if (!db) {
    console.warn('Firebase is not initialized. Returning empty followers array.');
    return [];
  }

  try {
    const followsRef = collection(db, 'follows');
    const q = query(
      followsRef,
      where('followingId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const followers: FollowRelation[] = [];
    
    querySnapshot.forEach((doc) => {
      followers.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as FollowRelation);
    });
    
    return followers;
  } catch (error) {
    console.error('Error getting followers:', error);
    return [];
  }
}

// Get users that user is following
export async function getFollowing(userId: string): Promise<FollowRelation[]> {
  // Check if Firebase is initialized
  if (!db) {
    console.warn('Firebase is not initialized. Returning empty following array.');
    return [];
  }

  try {
    const followsRef = collection(db, 'follows');
    const q = query(
      followsRef,
      where('followerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const following: FollowRelation[] = [];
    
    querySnapshot.forEach((doc) => {
      following.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as FollowRelation);
    });
    
    return following;
  } catch (error) {
    console.error('Error getting following:', error);
    return [];
  }
}

// Get social stats for a user
export async function getSocialStats(userId: string): Promise<SocialStats> {
  // Check if Firebase is initialized
  if (!db) {
    console.warn('Firebase is not initialized. Returning default social stats.');
    return { followersCount: 0, followingCount: 0 };
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        followersCount: userData.followersCount || 0,
        followingCount: userData.followingCount || 0
      };
    }
    
    return { followersCount: 0, followingCount: 0 };
  } catch (error) {
    console.error('Error getting social stats:', error);
    return { followersCount: 0, followingCount: 0 };
  }
}

// Add activity to feed
export async function addActivity(activity: Omit<ActivityItem, 'id'>): Promise<boolean> {
  // Check if Firebase is initialized
  if (!db) {
    console.warn('Firebase is not initialized. Cannot add activity.');
    return false;
  }

  try {
    const activitiesRef = collection(db, 'activities');
    await addDoc(activitiesRef, {
      ...activity,
      createdAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error adding activity:', error);
    return false;
  }
}

// Get activity feed for user (activities from users they follow)
export async function getActivityFeed(
  userId: string, 
  limit: number = 20
): Promise<ActivityItem[]> {
  // Check if Firebase is initialized
  if (!db) {
    console.warn('Firebase is not initialized. Returning empty activity feed.');
    return [];
  }

  try {
    // First get list of users the current user follows
    const following = await getFollowing(userId);
    const followingIds = following.map(f => f.followingId);
    
    // Include user's own activities
    followingIds.push(userId);
    
    if (followingIds.length === 0) {
      return [];
    }

    const activitiesRef = collection(db, 'activities');
    const q = query(
      activitiesRef,
      where('userId', 'in', followingIds.slice(0, 10)), // Firestore limit for 'in' queries
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const activities: ActivityItem[] = [];
    
    querySnapshot.forEach((doc) => {
      activities.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as ActivityItem);
    });
    
    return activities.slice(0, limit);
  } catch (error) {
    console.error('Error getting activity feed:', error);
    return [];
  }
}

// Get suggested users to follow
export async function getSuggestedUsers(
  currentUserId: string,
  limit: number = 10
): Promise<any[]> {
  // Check if Firebase is initialized
  if (!db) {
    console.warn('Firebase is not initialized. Returning empty suggestions.');
    return [];
  }

  try {
    // Get users that current user is NOT following
    const following = await getFollowing(currentUserId);
    const followingIds = following.map(f => f.followingId);
    followingIds.push(currentUserId); // Exclude self

    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const suggestions: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (!followingIds.includes(userData.uid) && suggestions.length < limit) {
        suggestions.push({
          uid: userData.uid,
          username: userData.username,
          displayName: userData.displayName,
          nickname: userData.nickname,
          bio: userData.bio,
          isBusinessProfile: 'companyName' in userData,
          followersCount: userData.followersCount || 0
        });
      }
    });
    
    return suggestions;
  } catch (error) {
    console.error('Error getting suggested users:', error);
    return [];
  }
}