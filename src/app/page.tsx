
'use client';

import { useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import LandingPage from '@/components/pages/LandingPage';
import { AppContext } from '@/context/AppContext';
import PublicHeader from '@/components/layout/PublicHeader';

export default function Home() {
  const { authLoading, user, appUser, appUserLoading } = useContext(AppContext);
  const router = useRouter();

  useEffect(() => {
    // Once we're sure auth state is loaded and there's a logged-in user
    if (!authLoading && user && !appUserLoading) {
      if (appUser && appUser.restaurantIds.length > 0) {
        // If they have a restaurant, go to the dashboard
        router.replace('/order-entry');
      } else if (appUser) {
        // If they don't have a restaurant, go to onboarding
        router.replace('/onboarding');
      }
    }
  }, [user, authLoading, appUser, appUserLoading, router]);

  // Show a loading skeleton while we're checking the auth state
  // or if the user is logged in and we're about to redirect.
  if (authLoading || appUserLoading || user) {
    return (
      <div className="relative flex min-h-screen flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
            <div className="space-y-4">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-8 w-1/4" />
                <div className="flex gap-8">
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        </main>
      </div>
    );
  }
  
  // If no user is logged in, show the public landing page with a header.
  return (
    <div className="relative flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        <LandingPage />
      </main>
    </div>
  );
}
