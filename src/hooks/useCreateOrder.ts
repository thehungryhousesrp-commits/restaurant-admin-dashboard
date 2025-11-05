'use client';

import { useState, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AppContext } from '@/context/AppContext';
import { placeOrder } from '@/lib/order';
import { type OrderItem, type CustomerInfo, type Table } from '@/lib/types';

export const useCreateOrder = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { restaurantId, tables } = useContext(AppContext);

  const createOrder = async (orderItems: OrderItem[], tableId: string, customerInfo?: CustomerInfo) => {
    if (!restaurantId) {
      toast({ title: 'Error', description: 'No active restaurant selected.', variant: 'destructive' });
      return false;
    }

    if (orderItems.length === 0) {
      toast({ title: 'Error', description: 'Cannot create an empty order.', variant: 'destructive' });
      return false;
    }

    setLoading(true);

    try {
      const selectedTable = tables.find(t => t.id === tableId) || null;

      await placeOrder(restaurantId, orderItems, customerInfo || { name: 'N/A', phone: 'N/A' }, selectedTable);

      toast({ 
        title: 'Order Placed Successfully!', 
        description: `Order for table ${selectedTable?.name || 'Takeaway'} has been sent to the kitchen.` 
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
