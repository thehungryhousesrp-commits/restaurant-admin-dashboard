"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import InvoiceDisplay from '@/components/order/InvoiceDisplay';
import { notFound } from 'next/navigation';
import { type Order } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from "@/components/ui/separator";
import { Button } from '@/components/ui/button';
import { AlertCircle, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ✅ IMPORTANT: params is now a Promise in Next.js 15
interface InvoicePageProps {
  params: Promise<{
    orderId: string;
  }>;
}

interface PDFGenerationOptions {
  scale: number;
  quality: number;
  format: 'A4' | 'letter';
}

type ToastType = 'success' | 'error' | 'info';

const PDF_GENERATION_OPTIONS: PDFGenerationOptions = {
  scale: 2,
  quality: 0.95,
  format: 'A4',
};

const ERROR_MESSAGES = {
  NO_ORDER_ID: 'No Order ID provided. Please check the URL.',
  ORDER_NOT_FOUND: 'Order not found. It may have been deleted or the ID is incorrect.',
  PERMISSION_DENIED: 'You do not have permission to view this invoice. Please contact support.',
  PDF_GENERATION: 'Failed to generate PDF. Please try again or contact support.',
  FIRESTORE_ERROR: 'Failed to load invoice data. Please refresh the page.',
  FIRESTORE_TIMEOUT: 'Request timed out. Please check your internet connection and try again.',
  PDF_DOWNLOAD: 'Failed to download PDF. Please try again.',
} as const;

const FIRESTORE_TIMEOUT_MS = 10000;

// Utility Functions
const generatePdfFilename = (orderId: string): string => {
  const timestamp = new Date().toISOString().split('T');
  const shortId = orderId.slice(-6).toUpperCase();
  return `invoice-${shortId}-${timestamp}.pdf`;
};

const isPermissionError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('permission') ||
    message.includes('missing or insufficient permissions') ||
    message.includes('permission_denied')
  );
};

const isTimeoutError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  
  const message = error.message.toLowerCase();
  return message.includes('timeout') || message.includes('etimedout');
};

const getErrorMessage = (error: unknown): string => {
  if (isPermissionError(error)) {
    return ERROR_MESSAGES.PERMISSION_DENIED;
  }
  if (isTimeoutError(error)) {
    return ERROR_MESSAGES.FIRESTORE_TIMEOUT;
  }
  return ERROR_MESSAGES.FIRESTORE_ERROR;
};

// Toast Component
interface ToastProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
}

const Toast = ({ message, type, onDismiss }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const alertStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconStyles = {
    success: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    error: <AlertCircle className="h-4 w-4 text-red-600" />,
    info: <AlertCircle className="h-4 w-4 text-blue-600" />,
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-sm ${alertStyles[type]} border rounded-lg p-4 flex items-start gap-3 shadow-lg`}>
      {iconStyles[type]}
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button onClick={onDismiss} className="text-lg font-bold opacity-70 hover:opacity-100">
        ×
      </button>
    </div>
  );
};

// Loading Skeleton
const InvoiceLoadingSkeleton = () => (
  <div className="bg-gray-100 min-h-screen py-8 sm:py-12">
    <div className="container mx-auto px-4">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-20 w-full" />
        <Separator />
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Separator />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
        <Separator />
        <div className="flex justify-end">
          <Skeleton className="h-6 w-1/3" />
        </div>
      </div>
    </div>
  </div>
);

// Error Display
interface ErrorDisplayProps {
  title: string;
  message: string;
  showDetails?: boolean;
}

const ErrorDisplay = ({ title, message, showDetails = false }: ErrorDisplayProps) => (
  <div className="container mx-auto px-4 py-8">
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6 sm:p-8">
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800 ml-3">
          <h2 className="text-lg font-semibold mb-2">{title}</h2>
          <p className="text-sm mb-3">{message}</p>
          {showDetails && (
            <p className="text-xs opacity-75">
              If this problem persists, please contact support with your Order ID.
            </p>
          )}
        </AlertDescription>
      </Alert>
      <Button
        onClick={() => window.location.href = '/orders'}
        className="mt-6 w-full sm:w-auto"
      >
        Back to Orders
      </Button>
    </div>
  </div>
);

// Main Component
export default function InvoicePage({ params }: InvoicePageProps) {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ✅ NEW: Unwrap the async params promise
  useEffect(() => {
    const unwrapParams = async () => {
      try {
        const resolvedParams = await params;
        setOrderId(resolvedParams.orderId);
      } catch (error) {
        console.error('[Invoice] Error unwrapping params:', error);
        setError(ERROR_MESSAGES.NO_ORDER_ID);
        setLoading(false);
      }
    };

    unwrapParams();
  }, [params]);

  // Fetch order from Firestore
  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      if (!orderId || typeof orderId !== 'string') {
        setError(ERROR_MESSAGES.NO_ORDER_ID);
        setLoading(false);
        console.warn('[Invoice] Invalid Order ID:', orderId);
        return;
      }

      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(
        () => abortControllerRef.current?.abort(),
        FIRESTORE_TIMEOUT_MS
      );

      try {
        setLoading(true);
        setError(null);

        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          console.warn('[Invoice] Order not found:', orderId);
          setError(ERROR_MESSAGES.ORDER_NOT_FOUND);
          setLoading(false);
          return;
        }

        const orderData = { id: docSnap.id, ...docSnap.data() } as Order;
        setOrder(orderData);
        console.log('[Invoice] Order fetched successfully:', orderId);
      } catch (err) {
        console.error('[Invoice] Error fetching order:', {
          orderId,
          error: err instanceof Error ? err.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });

        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    fetchOrder();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [orderId]);

  // PDF Download Handler
  const handleDownloadPdf = useCallback(async () => {
    if (!invoiceRef.current || !order?.id) {
      console.error('[Invoice] Missing invoice reference or order ID');
      setToast({
        message: ERROR_MESSAGES.PDF_GENERATION,
        type: 'error',
      });
      return;
    }

    setIsDownloading(true);

    try {
      console.log('[Invoice] Starting PDF generation...');
      const canvas = await html2canvas(invoiceRef.current, {
        scale: PDF_GENERATION_OPTIONS.scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#FFFFFF',
      });

      const imgData = canvas.toDataURL('image/jpeg', PDF_GENERATION_OPTIONS.quality);
      const pdfWidth = canvas.width;
      const pdfHeight = canvas.height;

      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
        unit: 'px',
        format: [pdfWidth, pdfHeight],
        compress: true,
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      const filename = generatePdfFilename(order.id);
      pdf.save(filename);

      console.log('[Invoice] PDF downloaded successfully:', filename);
      setToast({
        message: `Invoice downloaded as ${filename}`,
        type: 'success',
      });
    } catch (error) {
      console.error('[Invoice] PDF generation error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId: order?.id,
        timestamp: new Date().toISOString(),
      });

      setToast({
        message: ERROR_MESSAGES.PDF_DOWNLOAD,
        type: 'error',
      });
    } finally {
      setIsDownloading(false);
    }
  }, [order?.id]);

  // Render
  if (loading) {
    return <InvoiceLoadingSkeleton />;
  }

  if (error === ERROR_MESSAGES.ORDER_NOT_FOUND) {
    return (
      <ErrorDisplay
        title="Order Not Found"
        message={error}
        showDetails
      />
    );
  }

  if (error === ERROR_MESSAGES.PERMISSION_DENIED) {
    return (
      <ErrorDisplay
        title="Access Denied"
        message={error}
        showDetails={false}
      />
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Unable to Load Invoice"
        message={error}
        showDetails={true}
      />
    );
  }

  if (!order) {
    notFound();
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto mb-6 flex justify-end">
          <Button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="gap-2 shadow-md hover:shadow-lg transition-shadow"
            size="lg"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </>
            )}
          </Button>
        </div>

        <InvoiceDisplay order={order} ref={invoiceRef} />
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}