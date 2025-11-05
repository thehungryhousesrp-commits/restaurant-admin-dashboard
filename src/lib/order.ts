

import { type Order, type OrderItem, type CustomerInfo, type Table, type Restaurant } from "./types";
import { serverTimestamp, writeBatch, doc, collection, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export const placeOrder = async (
    restaurantId: string,
    currentOrder: OrderItem[],
    customerInfo: CustomerInfo,
    selectedTable: Table | null
): Promise<{ finalOrder: Order; docRef: any; }> => {
    const subtotal = currentOrder.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    const total = Math.round(subtotal + cgst + sgst);

    // Fetch the current restaurant data to get the logo and name
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantSnap = await getDoc(restaurantRef);
    const restaurantData = restaurantSnap.data() as Restaurant;

    // Create the order data that will be stored in the subcollection
    const newOrderData: Omit<Order, 'id'> = {
        items: currentOrder.map(item => ({
            ...item,
            total: item.price * item.quantity,
        })),
        customerInfo: customerInfo,
        tableId: selectedTable?.id || 'takeaway',
        tableName: selectedTable?.name || 'Takeaway',
        subtotal,
        cgst,
        sgst,
        total,
        status: 'Preparing' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        restaurantId: restaurantId,
        restaurantName: restaurantData?.name || 'Unnamed Restaurant',
        restaurantLogoUrl: restaurantData?.logoUrl || '',
        userId: 'staff-member-1', // This should be dynamic in a real app from auth context
        preparedItems: [], // Initialize as empty array
    };

    const batch = writeBatch(db);

    // 1. Reference to the order in the restaurant-specific subcollection ONLY.
    const restaurantOrderRef = doc(collection(db, `restaurants/${restaurantId}/orders`));
    batch.set(restaurantOrderRef, newOrderData);

    // 2. If it's a dine-in order, update the table status
    if (selectedTable) {
        const tableRef = doc(db, `restaurants/${restaurantId}/tables`, selectedTable.id);
        batch.update(tableRef, { status: 'occupied' });
    }
    
    // Commit the batch
    await batch.commit();

    return {
        finalOrder: { id: restaurantOrderRef.id, ...newOrderData } as any, // Cast to any to handle serverTimestamp
        docRef: restaurantOrderRef
    };
};


export const deleteOrders = async (restaurantId: string, orderIds: string[]) => {
    if (orderIds.length === 0) return;
    const batch = writeBatch(db);
    orderIds.forEach(id => {
        // Delete only from the tenant-scoped collection
        const restaurantOrderRef = doc(db, `restaurants/${restaurantId}/orders`, id);
        batch.delete(restaurantOrderRef);
    });
    await batch.commit();
};

export const updateTableStatus = async (restaurantId: string, tableId: string, status: Table['status']) => {
    const tableRef = doc(db, `restaurants/${restaurantId}/tables`, tableId);
    await updateDoc(tableRef, { status });
};
