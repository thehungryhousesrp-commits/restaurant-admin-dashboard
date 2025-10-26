
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { Skeleton } from '@/components/ui/skeleton';
import KitchenDisplay from '@/components/pages/KitchenDisplay';
import Header from '@/components/layout/Header';

export default function KitchenPage() {
    const { user, loadingAuth } = useAppContext();
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
                <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="h-64 rounded-lg" />
                    ))}
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <KitchenDisplay />
        </>
    );
}
