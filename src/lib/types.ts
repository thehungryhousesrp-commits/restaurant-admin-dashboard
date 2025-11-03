export interface Category {
  id: string;
  name: string;
}

export interface Table {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'reserved';
}

export interface MenuItem {
  id: string;
  name:string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  isVeg: boolean;
}

export interface OrderItem extends MenuItem {
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
}

// This defines the structure of an order AS IT IS STORED IN FIRESTORE
// Note: `id` is not stored in the document itself, but is the document ID.
export interface Order {
  id: string; // Document ID from Firestore
  items: {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  customerInfo: CustomerInfo;
  tableId?: string;
  tableName?: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
  status: 'Pending' | 'Preparing' | 'Completed' | 'Billed';
  createdAt: number;
  createdBy: string | null;
}
