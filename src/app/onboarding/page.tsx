
'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import CreateRestaurantForm from '@/components/onboarding/CreateRestaurantForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function OnboardingPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
        // If not logged in, they shouldn't be here. Send to login.
        router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="space-y-4 max-w-lg mx-auto">
                <Skeleton className="h-12 w-2/3" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-1/3" />
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Welcome to Reskot, {user.displayName}!</CardTitle>
            <CardDescription>Let's get your first restaurant set up.</CardDescription>
        </CardHeader>
        <CardContent>
            <CreateRestaurantForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
