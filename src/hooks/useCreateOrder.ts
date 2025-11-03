'use client';

import { useState } from 'react';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { type OrderItem } from '@/lib/types';

export const useCreateOrder = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createOrder = async (orderItems: OrderItem[], tableId: string, customerInfo?: { name: string; phone: string }) => {
    if (orderItems.length === 0) {
      toast({ title: 'Error', description: 'Cannot create an empty order.', variant: 'destructive' });
      return false;
    }

    setLoading(true);
    const batch = writeBatch(db);

    try {
      // 1. Create a new order document reference
      const newOrderRef = doc(collection(db, 'orders'));

      // 2. Calculate total
      const total = orderItems.reduce((acc, item) => acc + item.total, 0);

      // 3. Define the new order object
      const newOrder = {
        id: newOrderRef.id,
        items: orderItems,
        total,
        status: 'Preparing', // Default status for new orders
        tableId: tableId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(customerInfo && { customerInfo }),
      };

      // 4. Add the new order to the batch
      batch.set(newOrderRef, newOrder);

      // 5. Update the table status to 'occupied'
      const tableRef = doc(db, 'tables', tableId);
      batch.update(tableRef, { status: 'occupied' });

      // 6. Commit the batch
      await batch.commit();

      toast({ 
        title: 'Order Placed Successfully!', 
        description: `Order for table ${tableId} has been sent to the kitchen.` 
      });
      
      setLoading(false);
      return true;

    } catch (error) {
      console.error("Error creating order: ", error);
      toast({ 
        title: 'Order Failed',
        description: 'There was a problem placing the order. Please try again.',
        variant: 'destructive' 
      });
      setLoading(false);
      return false;
    }
  };

  return { createOrder, loading };
};
