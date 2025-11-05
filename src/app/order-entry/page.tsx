
'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import DashboardHeader from "@/components/layout/DashboardHeader";
import OrderEntryPoint from "@/components/pages/OrderEntryPoint";
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OrderEntryPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
        router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="relative flex min-h-screen flex-col">
        <DashboardHeader />
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
      <DashboardHeader />
      <main className="flex-1">
        <OrderEntryPoint />
      </main>
    </div>
  );
}

