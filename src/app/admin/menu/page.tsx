
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import AdminDashboard from '@/components/admin/AdminDashboard';
import DashboardHeader from '@/components/layout/DashboardHeader';

export default function AdminMenuPage() {
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
                        <Skeleton className="h-12 w-1/3" />
                        <Skeleton className="h-8 w-1/4" />
                        <div className="flex gap-8">
                            <Skeleton className="h-96 w-64" />
                            <Skeleton className="h-96 flex-1" />
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div>
            <DashboardHeader />
            <AdminDashboard />
        </div>
    );
}
