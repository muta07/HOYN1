import { notFound } from 'next/navigation';
import { Profile, UserProfile, BusinessProfile, HOYNProfile } from '@/lib/firebase';
import UserProfileClient from './UserProfileClient'; // We will create this component next
import { headers } from 'next/headers';

interface PageProps {
  params: {
    username: string;
  };
}

// This is a helper function to fetch data on the server using our new API route.
async function getProfile(username: string): Promise<UserProfile | BusinessProfile | HOYNProfile | null> {
    const host = headers().get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    // We use the absolute URL for server-side fetch
    const res = await fetch(`${protocol}://${host}/api/profile/${username}`, {
        next: { revalidate: 60 } // Revalidate data every 60 seconds to keep it fresh
    });

    if (res.status === 404) {
        return null;
    }

    if (!res.ok) {
        // For other errors, we can log them on the server and treat as not found for the user.
        console.error(`Failed to fetch profile for ${username}:`, res.status, await res.text());
        return null;
    }

    return res.json();
}


// This is now a React Server Component.
// It fetches data on the server before rendering the page.
export default async function UserProfilePage({ params }: PageProps) {
  const { username } = params;
  const profile = await getProfile(username);

  if (!profile) {
    // notFound() is the standard Next.js way to trigger a 404 page.
    notFound();
  }

  // The complex UI and client-side logic is delegated to UserProfileClient.
  // We pass the server-fetched data as props.
  return <UserProfileClient profile={profile} username={username} />;
}