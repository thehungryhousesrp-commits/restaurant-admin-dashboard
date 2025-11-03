
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/layout/Header';
import KitchenDisplay from '@/components/pages/KitchenDisplay';

export default function KitchenPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const router = useRouter();

    useEffect(() => {
        if (!loadingAuth && !user) {
            router.push('/login');
        }
    }, [user, loadingAuth, router]);

    if (loadingAuth || !user) {
        return (
            <>
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-1/3 mb-6" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-64 rounded-lg" />
                            ))}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div>
            <Header />
            <KitchenDisplay />
        </div>
    );
}
