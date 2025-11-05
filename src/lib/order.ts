
import { type Order, type OrderItem, type CustomerInfo, type Table } from "./types";
import { serverTimestamp, writeBatch, doc, collection, updateDoc, addDoc } from "firebase/firestore";
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

    const newOrderData = {
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
        userId: 'staff-member-1', // This should be dynamic in a real app from auth context
    };

    const ordersColRef = collection(db, `restaurants/${restaurantId}/orders`);
    const newOrderRef = doc(ordersColRef); // Create a reference with a new ID

    const batch = writeBatch(db);
    
    // Set the new order document in the batch
    batch.set(newOrderRef, newOrderData);

    // If it's a dine-in order, update the table status
    if (selectedTable) {
        const tableRef = doc(db, `restaurants/${restaurantId}/tables`, selectedTable.id);
        batch.update(tableRef, { status: 'occupied' });
    }
    
    // Commit the batch
    await batch.commit();

    return {
        finalOrder: { id: newOrderRef.id, ...newOrderData } as any, // Cast to any to handle serverTimestamp
        docRef: newOrderRef
    };
};


export const deleteOrders = async (restaurantId: string, orderIds: string[]) => {
    if (orderIds.length === 0) return;
    const batch = writeBatch(db);
    orderIds.forEach(id => {
        const docRef = doc(db, `restaurants/${restaurantId}/orders`, id);
        batch.delete(docRef);
    });
    await batch.commit();
};

export const updateTableStatus = async (restaurantId: string, tableId: string, status: Table['status']) => {
    const tableRef = doc(db, `restaurants/${restaurantId}/tables`, tableId);
    await updateDoc(tableRef, { status });
};
