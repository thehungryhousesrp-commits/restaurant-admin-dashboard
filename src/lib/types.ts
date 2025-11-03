
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

export interface CustomerInfo {
  name: string;
  phone: string;
}

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  customerInfo: CustomerInfo;
  tableId: string;
  tableName: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
  status: 'Preparing' | 'Completed' | 'Cancelled' | 'Billed';
  createdAt: any; 
  updatedAt: any;
  restaurantId: string;
  userId: string;
}
