"use client";

import { useEffect, useState, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import InvoiceDisplay from '@/components/order/InvoiceDisplay';
import { notFound } from 'next/navigation';
import { type Order } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from "@/components/ui/separator";
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoicePageProps {
  params: {
    orderId: string;
  };
}

export default function InvoicePage({ params }: InvoicePageProps) {
  const { orderId } = params; // Correctly destructure here
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

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

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || !order) return;
    setIsDownloading(true);

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // Improve resolution
        allowTaint: true,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`invoice-${order.id.slice(-6).toUpperCase()}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      // You might want to show a toast message to the user here
    } finally {
      setIsDownloading(false);
    }
  };

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
        <div className="max-w-md mx-auto mb-4 text-right">
            <Button onClick={handleDownloadPdf} disabled={isDownloading}>
                {isDownloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Download className="mr-2 h-4 w-4" />
                )}
                Download PDF
            </Button>
        </div>
        <InvoiceDisplay order={order} ref