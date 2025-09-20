"use server";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Order } from '@/lib/types';

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Order;
    } else {
      console.log('No such document!');
      return null;
    }
  } catch (error) {
    console.error("Error getting document:", error);
    throw new Error('Failed to fetch order.');
  }
}

    