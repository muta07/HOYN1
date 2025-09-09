import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import DOMPurify from 'isomorphic-dompurify';
import { User } from 'firebase/auth';
import { ProfileCustomization } from '@/components/providers/ThemeProvider';
import { 
  getFirestore, 
  doc, 
  getDoc,
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  orderBy,
  serverTimestamp,
  increment,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { getDatabase } from 'firebase/database';

export interface Profile {
  id: string;
  ownerUid: string;
  slug: string;
  type: "personal" | "business" | "car" | "tshirt" | "pet";
  displayName?: string;
  bio?: string;
  imageUrl?: string;
  qrCodeUrl?: string;
  socialLinks?: Array<{
    platform: string;
    url: string;
    label: string;
    icon?: string;
  }>;
  showMode?: "fullProfile" | "message" | "song";
  customMessage?: string;
  customSong?: string;
  mood?: {
    mode: "profile" | "note" | "song";
    text?: string;
    spotify?: {
      trackId: string;
      url: string;
      trackName?: string;
      artist?: string;
    };
  };
  isPublic: boolean;
  stats: {
    views: number;
    scans: number;
    messages: number;
    followers: number;
    clicks: number;  // Add clicks property
  };
  createdAt: Date;
  updatedAt?: Date;
}

export interface Message {
  id: string;
  senderId?: string | null; // null for anonymous messages
  senderName: string; // "Anonymous" or actual username
  recipientId: string;
  text: string;
  timestamp: Date;
  isRead?: boolean;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  participants: string[]; // array of user IDs
  lastMessage: string;
  lastUpdated: Date;
  unreadCounts: { [userId: string]: number };
  isAnonymousThread?: boolean; // true for anonymous conversations
}

export interface ProfileMessage {
  id: string;
  content: string;
  senderId: string | null; // null if anonymous
  isAnonymous: boolean;
  timestamp: Date;
  replied: boolean;
  replyContent: string | null;
}

export interface ProfileFollow {
  id: string;
  followerId: string;
  followerProfileId: string;
  followedAt: Date;
}

export interface QRCode {
  id: string;
  ownerId: string;
  redirectUrl: string;
  used: boolean;
  createdAt: Date;
  lastScanBy: string | null;
  lastScanAt: Date | null;
}

export interface UserProfile extends Profile {
  uid: string;
  email?: string;
  nickname?: string;
  photoURL?: string;
  profileCustomization?: ProfileCustomization;  // Add this line
}

export interface BusinessProfile extends Profile {
  businessName: string;
  businessType: string;
  sector?: string;
  foundedYear?: number;
  employeeCount?: string;
  phone?: string;
  website?: string;
  address?: string;
  description?: string;
  services?: string[];
  openingHours?: string;
  workingHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  location?: {
    lat: number;
    lng: number;
    city?: string;
    district?: string;
    country?: string;
  };
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
  contactInfo?: {
    email2?: string;
    whatsapp?: string;
  };
  businessSettings?: {
    showEmployeeCount?: boolean;
    showFoundedYear?: boolean;
    showWorkingHours?: boolean;
    allowDirectMessages?: boolean;
    showLocation?: boolean;
  };
  nickname?: string;
}

export interface HOYNProfile {
  id: string;
  ownerUid: string;
  username: string;
  type: 'personal' | 'business';
  displayName: string;
  bio?: string;
  imageUrl?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

declare global {
  var firebaseApp: import('firebase/app').FirebaseApp | undefined;
}

let app: import('firebase/app').FirebaseApp | null = null;
let db: import('firebase/firestore').Firestore | null = null;
let storage: any = null; // Fix type error by using any instead of Storage
let auth: import('firebase/auth').Auth | null = null;

try {
  if (firebaseConfig.apiKey) {
    if (typeof window !== 'undefined' && !globalThis.firebaseApp) {
      app = initializeApp(firebaseConfig);
      globalThis.firebaseApp = app;
    } else if (typeof window !== 'undefined' && globalThis.firebaseApp) {
      app = globalThis.firebaseApp;
    } else if (firebaseConfig.apiKey) {
      app = initializeApp(firebaseConfig);
    }
    
    if (app) {
      db = getFirestore(app);
      storage = getStorage(app);
      auth = getAuth(app);
    }
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  // Set defaults to null if Firebase fails to initialize
  app = null;
  db = null;
  storage = null;
  auth = null;
}

// Export Firebase instances (may be null if Firebase is not configured)
export { db, storage, auth };

// Helper function to check if Firebase is initialized
function isFirebaseInitialized(): boolean {
  return db !== null && auth !== null && storage !== null;
}

export async function createProfile(
  ownerUid: string, 
  profileData: Omit<Profile, 'id' | 'ownerUid' | 'createdAt' | 'stats'>
): Promise<Profile | null> {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.warn('Firebase is not initialized. Profile creation skipped.');
    return null;
  }

  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Profile creation skipped.');
    return null;
  }
  
  try {
    const profileId = `${profileData.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const slug = `${profileData.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const profileRef = doc(db, 'profiles', profileId);
    
    // Generate the QR code URL for this profile
    const { generateProfileQRUrl } = await import('./qr-utils');
    const qrCodeUrl = generateProfileQRUrl(slug);
    
    const fullProfile: Profile = {
      ...profileData,
      id: profileId,
      ownerUid,
      slug,
      qrCodeUrl, // Add the QR code URL to the profile
      showMode: 'fullProfile',
      socialLinks: [],
      stats: {
        views: 0,
        scans: 0,
        messages: 0,
        followers: 0,
        clicks: 0  // Add clicks property
      },
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(profileRef, fullProfile);
    return fullProfile;
  } catch (error) {
    console.error('Failed to create profile:', error);
    return null;
  }
}

export async function getUserProfiles(ownerUid: string): Promise<Profile[]> {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.warn('Firebase is not initialized. Returning empty profiles array.');
    return [];
  }

  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Returning empty profiles array.');
    return [];
  }
  
  try {
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('ownerUid', '==', ownerUid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      ...doc.data() as Omit<Profile, 'id'>, 
      id: doc.id 
    })) as Profile[];
  } catch (error) {
    console.error('Failed to get user profiles:', error);
    return [];
  }
}

export async function getPrimaryProfileForUser(ownerUid: string): Promise<Profile | null> {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.warn('Firebase is not initialized. Returning null profile.');
    return null;
  }

  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Returning null profile.');
    return null;
  }
  
  try {
    const profiles = await getUserProfiles(ownerUid);
    // Return the first profile or null if none exist
    return profiles.length > 0 ? profiles[0] : null;
  } catch (error) {
    console.error('Failed to get primary profile for user:', error);
    return null;
  }
}

export async function getProfileById(profileId: string): Promise<Profile | null> {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.warn('Firebase is not initialized. Returning null profile.');
    return null;
  }

  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Returning null profile.');
    return null;
  }
  
  try {
    const profileRef = doc(db, 'profiles', profileId);
    const docSnap = await getDoc(profileRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Profile;
    }
    return null;
  } catch (error) {
    console.error('Failed to get profile:', error);
    return null;
  }
}

export async function getProfileBySlug(slug: string): Promise<Profile | null> {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.warn('Firebase is not initialized. Returning null profile.');
    return null;
  }

  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Returning null profile.');
    return null;
  }
  
  try {
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const docSnapshot = snapshot.docs[0];
    return { 
      id: docSnapshot.id, 
      ...docSnapshot.data() as Omit<Profile, 'id'> 
    } as Profile;
  } catch (error) {
    console.error('Failed to get profile by slug:', error);
    return null;
  }
}

export async function updateProfile(
  profileId: string, 
  updates: Partial<Omit<Profile, 'id' | 'ownerUid' | 'createdAt'>>
): Promise<boolean> {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.warn('Firebase is not initialized. Profile update skipped.');
    return false;
  }

  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Profile update skipped.');
    return false;
  }
  
  try {
    const profileRef = doc(db, 'profiles', profileId);
    await updateDoc(profileRef, { 
      ...updates, 
      updatedAt: serverTimestamp() 
    });
    return true;
  } catch (error) {
    console.error('Failed to update profile:', error);
    return false;
  }
}

export async function deleteProfile(profileId: string): Promise<boolean> {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.warn('Firebase is not initialized. Profile deletion skipped.');
    return false;
  }

  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Profile deletion skipped.');
    return false;
  }
  
  try {
    const profileRef = doc(db, 'profiles', profileId);
    await deleteDoc(profileRef);
    return true;
  } catch (error) {
    console.error('Failed to delete profile:', error);
    return false;
  }
}

export async function incrementProfileStats(
  profileId: string, 
  statType: 'views' | 'scans' | 'messages' | 'followers', 
  incrementValue: number = 1
): Promise<boolean> {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.warn('Firebase is not initialized. Stats increment skipped.');
    return false;
  }

  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Stats increment skipped.');
    return false;
  }
  
  try {
    const profileRef = doc(db, 'profiles', profileId);
    await updateDoc(profileRef, {
      [`stats.${statType}`]: increment(incrementValue)
    });
    return true;
  } catch (error) {
    console.error('Failed to increment stats:', error);
    return false;
  }
}

export async function getUserSettings(userId: string): Promise<{
  canReceiveMessages: boolean;
  canReceiveAnonymous: boolean;
} | null> {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.warn('Firebase is not initialized. Returning default user settings.');
    // Default settings if Firebase is not available
    return {
      canReceiveMessages: true,
      canReceiveAnonymous: true
    };
  }

  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Returning default user settings.');
    return {
      canReceiveMessages: true,
      canReceiveAnonymous: true
    };
  }
  
  try {
    const settingsRef = doc(db, 'user_settings', userId);
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        canReceiveMessages: data.canReceiveMessages !== false, // default true
        canReceiveAnonymous: data.canReceiveAnonymous !== false // default true
      };
    }
    // Default settings if none exist
    return {
      canReceiveMessages: true,
      canReceiveAnonymous: true
    };
  } catch (error) {
    console.error('Failed to get user settings:', error);
    return null;
  }
}

// Helper function to get user display name
export async function getUserDisplayName(userId: string): Promise<string> {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.warn('Firebase is not initialized. Returning user ID as display name.');
    return userId;
  }

  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Returning user ID as display name.');
    return userId;
  }
  
  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data().displayName || userId;
    }
    return userId;
  } catch (error) {
    console.error('Failed to get user display name:', error);
    return userId;
  }
}

// Helper function to get or create conversation
async function getOrCreateConversation(
  senderId: string | null, 
  recipientId: string, 
  isAnonymous: boolean
): Promise<string> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot create conversation.');
    throw new Error('Database not available');
  }

  try {
    let conversationId: string;
    
    if (isAnonymous) {
      // For anonymous messages, use recipientId + '_anonymous' as conversation ID
      conversationId = `${recipientId}_anonymous`;
    } else {
      // For normal messages, sort IDs to create consistent conversation ID
      const ids = [senderId!, recipientId].sort();
      conversationId = `conv_${ids[0]}_${ids[1]}`;
    }

    const conversationRef = doc(db, 'conversations', conversationId);
    const docSnap = await getDoc(conversationRef);
    
    if (!docSnap.exists()) {
      // Create new conversation
      const participants = isAnonymous ? [recipientId] : [senderId!, recipientId];
      await setDoc(conversationRef, {
        participants,
        lastMessage: '',
        lastUpdated: serverTimestamp(),
        unreadCounts: {},
        isAnonymousThread: isAnonymous
      });
    }
    
    return conversationId;
  } catch (error) {
    console.error('Failed to get or create conversation:', error);
    throw error;
  }
}

// Message Functions
export async function sendMessage(
  senderId: string, 
  recipientId: string, 
  text: string, 
  senderName?: string
): Promise<boolean> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot send message.');
    return false;
  }

  try {
    // Check if recipient allows messages
    const recipientSettings = await getUserSettings(recipientId);
    if (!recipientSettings?.canReceiveMessages) {
      console.error('Recipient has disabled messages');
      return false;
    }

    const displayName = senderName || await getUserDisplayName(senderId);
    
    // Get or create conversation
    const conversationId = await getOrCreateConversation(senderId, recipientId, false);
    
    // Add message to conversation
    const messageData = {
      senderId,
      senderName: displayName,
      recipientId,
      text,
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, `conversations/${conversationId}/messages`), messageData);
    
    // Update conversation last message and timestamp
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: text,
      lastUpdated: serverTimestamp()
    });
    
    // Update unread count for recipient
    const unreadUpdate = {
      [`unreadCounts.${recipientId}`]: increment(1)
    };
    await updateDoc(doc(db, 'conversations', conversationId), unreadUpdate);
    
    // Increment message count for recipient profile
    await incrementProfileStats(recipientId, 'messages', 1);
    
    return true;
  } catch (error) {
    console.error('Failed to send message:', error);
    return false;
  }
}

export async function sendAnonymousMessage(
  recipientId: string, 
  text: string
): Promise<boolean> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot send anonymous message.');
    return false;
  }

  try {
    // Check if recipient allows anonymous messages
    const recipientSettings = await getUserSettings(recipientId);
    if (!recipientSettings?.canReceiveAnonymous) {
      console.error('Recipient has disabled anonymous messages');
      return false;
    }

    // Get or create anonymous conversation
    const conversationId = await getOrCreateConversation(null, recipientId, true);
    
    // Add anonymous message
    const messageData = {
      senderId: null,
      senderName: 'Anonymous',
      recipientId,
      text,
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, `conversations/${conversationId}/messages`), messageData);
    
    // Update conversation last message and timestamp
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: text,
      lastUpdated: serverTimestamp()
    });
    
    // For anonymous, no unread count update needed since only recipient is participant
    
    // Increment message count for recipient profile
    await incrementProfileStats(recipientId, 'messages', 1);
    
    return true;
  } catch (error) {
    console.error('Failed to send anonymous message:', error);
    return false;
  }
}

export async function getUserMessages(userId: string): Promise<Message[]> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Returning empty messages array.');
    return [];
  }

  try {
    // Get all conversations for this user
    const conversationsRef = collection(db, 'conversations');
    const conversationsSnapshot = await getDocs(conversationsRef);
    
    const allMessages: Message[] = [];
    
    for (const convDoc of conversationsSnapshot.docs) {
      const convData = convDoc.data();
      const isParticipant = convData.participants.includes(userId) || 
                           (convData.isAnonymousThread && convData.participants.includes(userId));
      
      if (isParticipant) {
        const messagesRef = collection(db, `conversations/${convDoc.id}/messages`);
        const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));
        const messagesSnapshot = await getDocs(messagesQuery);
        
        messagesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          allMessages.push({
            id: doc.id,
            ...data as Omit<Message, 'id'>
          });
        });
      }
    }
    
    // Sort all messages by timestamp
    return allMessages.sort((a, b) => 
      (b.timestamp as any).toDate().getTime() - (a.timestamp as any).toDate().getTime()
    );
  } catch (error) {
    console.error('Failed to get user messages:', error);
    return [];
  }
}

export async function getUserConversations(userId: string): Promise<Conversation[]> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Returning empty conversations array.');
    return [];
  }

  try {
    const conversationsRef = collection(db, 'conversations');
    const conversationsSnapshot = await getDocs(conversationsRef);
    
    const userConversations: Conversation[] = [];
    
    for (const convDoc of conversationsSnapshot.docs) {
      const convData = convDoc.data();
      const isParticipant = convData.participants.includes(userId) || 
                           (convData.isAnonymousThread && convData.participants.includes(userId));
      
      if (isParticipant) {
        let displayName = '';
        let isAnonymous = false;
        
        if (convData.isAnonymousThread) {
          displayName = 'Anonymous';
          isAnonymous = true;
        } else {
          // Find the other participant
          const otherParticipant = convData.participants.find((id: string) => id !== userId);
          if (otherParticipant) {
            displayName = await getUserDisplayName(otherParticipant);
          }
          isAnonymous = false;
        }
        
        const unreadCount = convData.unreadCounts?.[userId] || 0;
        
        userConversations.push({
          id: convDoc.id,
          participants: convData.participants,
          lastMessage: convData.lastMessage || '',
          lastUpdated: convData.lastUpdated,
          unreadCounts: convData.unreadCounts || {},
          isAnonymousThread: convData.isAnonymousThread || false
        });
      }
    }
    
    // Sort by lastUpdated
    return userConversations.sort((a, b) => {
      const getTime = (timestamp: any) => {
        if (timestamp instanceof Date) return timestamp.getTime();
        if (timestamp && typeof timestamp.toDate === 'function') return timestamp.toDate().getTime();
        return 0;
      };
      return getTime(b.lastUpdated) - getTime(a.lastUpdated);
    });
  } catch (error) {
    console.error('Failed to get user conversations:', error);
    return [];
  }
}

// Real-time listener for messages
export function onMessagesSnapshot(
  userId: string, 
  callback: (messages: Message[]) => void
) {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot set up messages listener.');
    return { unsubscribe: () => {} };
  }

  return onSnapshot(
    collection(db, 'messages'),
    (snapshot) => {
      const messages: Message[] = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.receiverId === userId || data.senderId === userId) {
          messages.push({
            id: doc.id,
            ...data as Omit<Message, 'id'>
          });
        }
      });
      callback(messages);
    }
  );
}

// Real-time listener for conversations
export function onConversationsSnapshot(
  userId: string, 
  callback: (conversations: Conversation[]) => void
) {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot set up conversations listener.');
    return { unsubscribe: () => {} };
  }

  return onSnapshot(
    collection(db, 'conversations'),
    (snapshot) => {
      const conversations: Conversation[] = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data() as Omit<Conversation, 'id'>;
        if (data.participants && data.participants.includes(userId)) {
          conversations.push({
            id: doc.id,
            ...data
          } as Conversation);
        }
      });
      callback(conversations);
    }
  );
}

// Mark message as read
export async function markMessageAsRead(conversationId: string, messageId: string, userId: string): Promise<boolean> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot mark message as read.');
    return false;
  }

  try {
    // For simplicity, we'll mark all messages in conversation as read for this user
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      [`unreadCounts.${userId}`]: 0
    });
    return true;
  } catch (error) {
    console.error('Failed to mark message as read:', error);
    return false;
  }
}

// Update user messaging settings
export async function updateUserMessagingSettings(
  userId: string, 
  settings: { canReceiveMessages: boolean; canReceiveAnonymous: boolean; }
): Promise<boolean> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot update messaging settings.');
    return false;
  }

  try {
    const settingsRef = doc(db, 'user_settings', userId);
    await setDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Failed to update messaging settings:', error);
    return false;
  }
}

// Profile Stats Functions
export async function incrementProfileViews(profileId: string): Promise<boolean> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot increment profile views.');
    return false;
  }

  try {
    const profileRef = doc(db, 'profiles', profileId);
    await updateDoc(profileRef, {
      'stats.views': increment(1)
    });
    return true;
  } catch (error) {
    console.error('Failed to increment profile views:', error);
    return false;
  }
}

export async function incrementProfileScans(profileId: string): Promise<boolean> {
  // Additional null check for db
  if (!db) {
    console.error('Firestore database is not available. Cannot increment profile scans.');
    return false;
  }

  try {
    const profileRef = doc(db, 'profiles', profileId);
    await updateDoc(profileRef, {
      'stats.scans': increment(1)
    });
    return true;
  } catch (error) {
    console.error('Failed to increment profile scans:', error);
    return false;
  }
}

export async function incrementProfileLinkClicks(profileId: string): Promise<boolean> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot increment profile link clicks.');
    return false;
  }

  try {
    const profileRef = doc(db, 'profiles', profileId);
    await updateDoc(profileRef, {
      'stats.clicks': increment(1),
      'stats.lastUpdated': serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Failed to increment profile link clicks:', error);
    return false;
  }
}

// Follow Functions
export async function followUser(followerId: string, followingId: string): Promise<boolean> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot follow user.');
    return false;
  }

  try {
    const followData: Omit<Follow, 'id'> = {
      followerId,
      followingId,
      createdAt: new Date()
    };

    // Create follow relationship
    await addDoc(collection(db, 'follows'), followData);

    // Update follower count
    await incrementProfileStats(followingId, 'followers', 1);

    return true;
  } catch (error) {
    console.error('Failed to follow user:', error);
    return false;
  }
}

export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot unfollow user.');
    return false;
  }

  try {
    // Find and delete the follow document
    const followsRef = collection(db, 'follows');
    const q = query(
      followsRef,
      where('followerId', '==', followerId),
      where('followingId', '==', followingId)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      await deleteDoc(doc(db, 'follows', snapshot.docs[0].id));
    }

    // Update counts
    await incrementProfileStats(followingId, 'followers', -1);

    return true;
  } catch (error) {
    console.error('Failed to unfollow user:', error);
    return false;
  }
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot check following status.');
    return false;
  }

  try {
    const followsRef = collection(db, 'follows');
    const q = query(
      followsRef,
      where('followerId', '==', followerId),
      where('followingId', '==', followingId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Failed to check following status:', error);
    return false;
  }
}

export async function getFollowers(profileId: string): Promise<Follow[]> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Returning empty followers array.');
    return [];
  }

  try {
    const followsRef = collection(db, 'follows');
    const q = query(followsRef, where('followingId', '==', profileId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as Omit<Follow, 'id'>
    })) as Follow[];
  } catch (error) {
    console.error('Failed to get followers:', error);
    return [];
  }
}

export async function getFollowing(userId: string): Promise<Follow[]> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Returning empty following array.');
    return [];
  }

  try {
    const followsRef = collection(db, 'follows');
    const q = query(followsRef, where('followerId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as Omit<Follow, 'id'>
    })) as Follow[];
  } catch (error) {
    console.error('Failed to get following:', error);
    return [];
  }
}

// Profile Image Upload Functions
export async function uploadProfileImage(profileId: string, file: File): Promise<string | null> {
  // Additional null check for storage
  if (!storage) {
    console.warn('Firebase storage is not available. Cannot upload profile image.');
    return null;
  }

  try {
    const storageRef = ref(storage, `profile-images/${profileId}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Failed to upload profile image:', error);
    return null;
  }
}

export async function deleteProfileImage(imageUrl: string): Promise<boolean> {
  // Additional null check for storage
  if (!storage) {
    console.warn('Firebase storage is not available. Cannot delete profile image.');
    return false;
  }

  try {
    // Note: This requires knowing the full path. In practice, you might need to store the path
    // For simplicity, we'll assume the image URL contains the path
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
    return true;
  } catch (error) {
    console.error('Failed to delete profile image:', error);
    return false;
  }
}

export async function sendProfileMessage(
  profileId: string,
  content: string,
  senderId: string | null,
  isAnonymous: boolean
): Promise<boolean> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot send profile message.');
    return false;
  }

  try {
    // Add message to profile's messages subcollection
    const messageData = {
      content,
      senderId,
      isAnonymous,
      timestamp: serverTimestamp(),
      replied: false,
      replyContent: null
    };

    await addDoc(collection(db, `profiles/${profileId}/messages`), messageData);
    
    // Increment message count for recipient profile
    await incrementProfileStats(profileId, 'messages', 1);
    
    return true;
  } catch (error) {
    console.error('Failed to send profile message:', error);
    return false;
  }
}

export async function replyToProfileMessage(
  profileId: string,
  messageId: string,
  replyContent: string
): Promise<boolean> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot reply to profile message.');
    return false;
  }

  try {
    const messageRef = doc(db, `profiles/${profileId}/messages/${messageId}`);
    await updateDoc(messageRef, {
      replied: true,
      replyContent
    });
    
    return true;
  } catch (error) {
    console.error('Failed to reply to profile message:', error);
    return false;
  }
}

export async function getProfileMessages(profileId: string): Promise<ProfileMessage[]> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Returning empty profile messages array.');
    return [];
  }

  try {
    const messagesRef = collection(db, `profiles/${profileId}/messages`);
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(messagesQuery);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        content: data.content,
        senderId: data.senderId,
        isAnonymous: data.isAnonymous,
        timestamp: data.timestamp instanceof Date ? data.timestamp : data.timestamp.toDate(),
        replied: data.replied,
        replyContent: data.replyContent
      };
    });
  } catch (error) {
    console.error('Failed to get profile messages:', error);
    return [];
  }
}

export function onProfileMessagesSnapshot(
  profileId: string, 
  callback: (messages: ProfileMessage[]) => void
) {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot set up profile messages listener.');
    return { unsubscribe: () => {} };
  }

  return onSnapshot(
    query(collection(db, `profiles/${profileId}/messages`), orderBy('timestamp', 'desc')),
    (snapshot) => {
      const messages: ProfileMessage[] = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          content: data.content,
          senderId: data.senderId,
          isAnonymous: data.isAnonymous,
          timestamp: data.timestamp instanceof Date ? data.timestamp : data.timestamp.toDate(),
          replied: data.replied,
          replyContent: data.replyContent
        });
      });
      callback(messages);
    }
  );
}

export async function followProfile(
  followerId: string,
  followerProfileId: string,
  followingProfileId: string
): Promise<boolean> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot follow profile.');
    return false;
  }

  try {
    // Check if already following
    const isAlreadyFollowing = await isProfileFollowing(followerId, followingProfileId);
    if (isAlreadyFollowing) {
      console.error('Already following this profile');
      return false;
    }

    const batch = writeBatch(db);

    // Add follower to following profile's followers subcollection
    const followerDocRef = doc(collection(db, `profiles/${followingProfileId}/followers`));
    batch.set(followerDocRef, {
      followerId,
      followerProfileId,
      followedAt: serverTimestamp()
    });

    // Add following to follower's following subcollection
    const followingDocRef = doc(collection(db, `profiles/${followerProfileId}/following`));
    batch.set(followingDocRef, {
      followingProfileId,
      followedAt: serverTimestamp()
    });

    // Update follower count for the following profile
    const followingProfileRef = doc(db, 'profiles', followingProfileId);
    batch.update(followingProfileRef, {
      'stats.followers': increment(1)
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Failed to follow profile:', error);
    return false;
  }
}

export async function unfollowProfile(
  followerId: string,
  followerProfileId: string,
  followingProfileId: string
): Promise<boolean> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot unfollow profile.');
    return false;
  }

  try {
    const batch = writeBatch(db);

    // Find and delete from following profile's followers subcollection
    const followersRef = collection(db, `profiles/${followingProfileId}/followers`);
    const followersQuery = query(
      followersRef,
      where('followerId', '==', followerId)
    );
    const followersSnapshot = await getDocs(followersQuery);
    
    followersSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Find and delete from follower's following subcollection
    const followingRef = collection(db, `profiles/${followerProfileId}/following`);
    const followingQuery = query(
      followingRef,
      where('followingProfileId', '==', followingProfileId)
    );
    const followingSnapshot = await getDocs(followingQuery);
    
    followingSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Update follower count for the following profile
    const followingProfileRef = doc(db, 'profiles', followingProfileId);
    batch.update(followingProfileRef, {
      'stats.followers': increment(-1)
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Failed to unfollow profile:', error);
    return false;
  }
}

export async function isProfileFollowing(
  followerId: string,
  followingProfileId: string
): Promise<boolean> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot check profile following status.');
    return false;
  }

  try {
    const followersRef = collection(db, `profiles/${followingProfileId}/followers`);
    const q = query(
      followersRef,
      where('followerId', '==', followerId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Failed to check following status:', error);
    return false;
  }
}

export async function getProfileFollowersCount(profileId: string): Promise<number> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Returning 0 followers count.');
    return 0;
  }

  try {
    const followersRef = collection(db, `profiles/${profileId}/followers`);
    const snapshot = await getDocs(followersRef);
    return snapshot.size;
  } catch (error) {
    console.error('Failed to get followers count:', error);
    return 0;
  }
}

export async function getProfileFollowingCount(profileId: string): Promise<number> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Returning 0 following count.');
    return 0;
  }

  try {
    const followingRef = collection(db, `profiles/${profileId}/following`);
    const snapshot = await getDocs(followingRef);
    return snapshot.size;
  } catch (error) {
    console.error('Failed to get following count:', error);
    return 0;
  }
}

export function onProfileFollowersSnapshot(
  profileId: string,
  callback: (followers: ProfileFollow[]) => void
) {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot set up profile followers listener.');
    return { unsubscribe: () => {} };
  }

  return onSnapshot(
    collection(db, `profiles/${profileId}/followers`),
    (snapshot) => {
      const followers: ProfileFollow[] = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        followers.push({
          id: doc.id,
          followerId: data.followerId,
          followerProfileId: data.followerProfileId,
          followedAt: data.followedAt instanceof Date ? data.followedAt : data.followedAt.toDate()
        });
      });
      callback(followers);
    }
  );
}

export function onProfileFollowingSnapshot(
  profileId: string,
  callback: (following: { id: string; followingProfileId: string; followedAt: Date }[]) => void
) {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot set up profile following listener.');
    return { unsubscribe: () => {} };
  }

  return onSnapshot(
    collection(db, `profiles/${profileId}/following`),
    (snapshot) => {
      const following: { id: string; followingProfileId: string; followedAt: Date }[] = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        following.push({
          id: doc.id,
          followingProfileId: data.followingProfileId,
          followedAt: data.followedAt instanceof Date ? data.followedAt : data.followedAt.toDate()
        });
      });
      callback(following);
    }
  );
}

// Export missing functions referenced in other files
export async function getHOYNProfileByUsername(username: string): Promise<HOYNProfile | null> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Returning null HOYN profile.');
    return null;
  }

  try {
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('username', '==', username));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const docSnapshot = snapshot.docs[0];
    return { 
      id: docSnapshot.id, 
      ...docSnapshot.data() as Omit<HOYNProfile, 'id'> 
    } as HOYNProfile;
  } catch (error) {
    console.error('Failed to get HOYN profile by username:', error);
    return null;
  }
}

export async function createHOYNProfile(
  ownerUid: string,
  profileData: Omit<HOYNProfile, 'id' | 'ownerUid' | 'createdAt'>
): Promise<HOYNProfile | null> {
  // Additional null check for db
  if (!db) {
    console.warn('Firestore database is not available. Cannot create HOYN profile.');
    return null;
  }

  try {
    const profileId = `${profileData.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const profileRef = doc(db, 'profiles', profileId);
    
    const fullProfile: HOYNProfile = {
      ...profileData,
      id: profileId,
      ownerUid,
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(profileRef, fullProfile);
    return fullProfile;
  } catch (error) {
    console.error('Failed to create HOYN profile:', error);
    return null;
  }
}
