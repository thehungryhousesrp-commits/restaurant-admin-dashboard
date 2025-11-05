
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import AboutPageContent from '@/components/pages/AboutPage';
import DashboardHeader from '@/components/layout/DashboardHeader';

export default function AboutPage() {
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
                <DashboardHeader />
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
            <DashboardHeader />
            <AboutPageContent adminName={adminName} />
        </div>
    );
}

