
import { type Order, type OrderItem, type CustomerInfo, type Table } from "./types";
import { serverTimestamp } from "firebase/firestore";

// This function creates a mock order object for invoice preview.
// It does not interact with a database.
export const placeOrder = (
    currentOrder: OrderItem[],
    customerInfo: CustomerInfo,
    selectedTable: Table
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
        restaurantId: 'main-restaurant',
        userId: 'staff-member-1',
    };
    
    // In a real app, you would save this to the database.
    // For this demo, we just return the object.
    return newOrder;
};
