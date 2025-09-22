"use client";

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import InvoiceDisplay from '@/components/order/InvoiceDisplay';
import { notFound } from 'next/navigation';
import { type Order } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from "@/components/ui/separator";

interface InvoicePageProps {
  params: {
    orderId: string;
  };
}

export default function InvoicePage({ params }: InvoicePageProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { orderId } = params;

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
          setError("No Order ID provided.");
          setLoading(false);
          return;
      }
      
      try {
        setLoading(true);
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError('Order not found.');
        } else {
          setOrder({ id: docSnap.id, ...docSnap.data() } as Order);
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
        if (err instanceof Error && (err.message.toLowerCase().includes('permission') || err.message.toLowerCase().includes('missing or insufficient permissions'))) {
             setError('You do not have permission to view this invoice. Please check your Firestore security rules.');
        } else {
             setError('Failed to load invoice data.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
        <div className="bg-gray-100 min-h-screen py-8 sm:py-12">
            <div className="container mx-auto px-4">
                <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 space-y-4">
                    <Skeleton className="h-20 w-20 mx-auto rounded-full" />
                    <Skeleton className="h-8 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-full mx-auto" />
                    <Skeleton className="h-4 w-full mx-auto" />
                    <Separator />
                    <Skeleton className="h-40 w-full" />
                    <Separator />
                    <Skeleton className="h-24 w-1/2 ml-auto" />
                </div>
            </div>
      </div>
    );
  }
  
  if (error) {
     return (
        <div className="container mx-auto px-4 py-8 text-center text-red-500">
            <h1 className="text-2xl font-bold">Error</h1>
            <p>{error}</p>
        </div>
     );
  }

  if (!order) {
    notFound();
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <InvoiceDisplay order={order} />
      </div>
    </div>
  );
}
