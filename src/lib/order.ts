
import { type Order, type OrderItem, type CustomerInfo, type Table } from "./types";
import { serverTimestamp, writeBatch, doc, collection, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

// This function creates a mock order object for invoice preview.
// It does not interact with a database.
export const placeOrder = (
    restaurantId: string,
    currentOrder: OrderItem[],
    customerInfo: CustomerInfo,
    selectedTable: Table | null
): Omit<Order, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: any; updatedAt: any } => {
    const subtotal = currentOrder.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    const total = Math.round(subtotal + cgst + sgst);

    const newOrder = {
        items: currentOrder.map(item => ({
            ...item,
            total: item.price * item.quantity, // Added total property
        })),
        customerInfo: customerInfo,
        tableId: selectedTable?.id || 'takeaway',
        tableName: selectedTable?.name || 'Takeaway',
        subtotal,
        cgst,
        sgst,
        total,
        status: 'Preparing' as const, // Use const assertion
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        restaurantId: restaurantId, // Ensure restaurantId is included
        userId: 'staff-member-1', // This should be dynamic in a real app
    };
    
    // In a real app, you would save this to the database.
    // This function only prepares the object.
    return newOrder;
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

/**
 * Updates the status of a specific table in Firestore within a restaurant's sub-collection.
 * @param restaurantId The ID of the restaurant.
 * @param tableId The ID of the table to update.
 * @param status The new status for the table.
 */
export const updateTableStatus = async (restaurantId: string, tableId: string, status: Table['status']) => {
    const tableRef = doc(db, `restaurants/${restaurantId}/tables`, tableId);
    await updateDoc(tableRef, { status });
};
