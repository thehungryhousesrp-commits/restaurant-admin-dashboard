
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { Skeleton } from '@/components/ui/skeleton';
import AboutPageContent from '@/components/pages/AboutPage';
import Header from '@/components/layout/Header';

export default function AboutPage() {
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
                <div className="container mx-auto px-4 py-8">
                    <div className="space-y-4">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-12 w-1/4" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </>
        );
    }
    
    const adminName = user.displayName || "Dishant";

    return (
        <div>
            <Header />
            <AboutPageContent adminName={adminName} />
        </div>
    );
}
