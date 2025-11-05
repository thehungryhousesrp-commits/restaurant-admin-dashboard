

export interface Category {
  id: string;
  name: string;
  restaurantId: string;
}

export interface Table {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'reserved';
  restaurantId: string;
}

export interface MenuItem {
  id: string;
  name:string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  isVeg: boolean;
  restaurantId: string;
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
  restaurantName: string;
  restaurantLogoUrl?: string; // Add logo URL to the order
  userId: string;
}


// New types for multi-tenancy
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber?: string | null;
  restaurantIds: string[]; // List of restaurant IDs the user has access to
  activeRestaurantId?: string; // The currently selected restaurant
}

export interface Restaurant {
  id: string;
  name: string;
  ownerId: string;
  logoUrl?: string; // Add optional logoUrl
  createdAt: any;
}
