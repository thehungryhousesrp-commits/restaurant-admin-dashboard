
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import AdminDashboard from "@/components/pages/AdminDashboard";
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/layout/Header';

export default function AdminMenuPage() {
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
                        <Skeleton className="h-12 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <AdminDashboard />
        </>
    );
}
