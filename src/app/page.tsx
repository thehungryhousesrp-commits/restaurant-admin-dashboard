
'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import Header from "@/components/layout/Header";
import OrderEntryPoint from "@/components/pages/OrderEntryPoint";
import LandingPage from '@/components/pages/LandingPage';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
            <div className="space-y-4">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-8 w-1/4" />
                <div className="flex gap-8">
                    <Skeleton className="h-96 w-64" />
                    <Skeleton className="h-96 flex-1" />
                </div>
            </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {user ? <OrderEntryPoint /> : <LandingPage />}
      </main>
    </div>
  );
}
