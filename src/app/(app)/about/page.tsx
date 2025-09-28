"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { Skeleton } from '@/components/ui/skeleton';
import AboutPageContent from '@/components/pages/AboutPage';

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
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-12 w-1/4" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }
    
    // Explicitly set the display name for the greeting
    const adminName = user.displayName || "Nishant";

    return (
        <div>
            <AboutPageContent adminName={adminName} />
        </div>
    );
}
