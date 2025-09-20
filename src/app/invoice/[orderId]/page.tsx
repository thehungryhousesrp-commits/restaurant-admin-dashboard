import { getOrderById } from '@/lib/firebase-helpers';
import InvoiceDisplay from '@/components/order/InvoiceDisplay';
import { notFound } from 'next/navigation';

interface InvoicePageProps {
  params: {
    orderId: string;
  };
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const order = await getOrderById(params.orderId);

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

    