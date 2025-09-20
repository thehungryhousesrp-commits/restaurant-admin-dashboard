export interface Category {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  imageHint: string;
  isAvailable: boolean;
  isVeg: boolean;
  isSpicy: boolean;
  isChefsSpecial: boolean;
}

export interface OrderItem extends MenuItem {
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  customerInfo: CustomerInfo;
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
  status: 'Pending' | 'Preparing' | 'Completed';
  createdAt: number;
}
