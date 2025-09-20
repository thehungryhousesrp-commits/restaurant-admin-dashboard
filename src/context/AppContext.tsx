"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { type MenuItem, type Category, type Order, type OrderItem, type CustomerInfo } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface AppContextType {
  menuItems: MenuItem[];
  categories: Category[];
  orders: Order[];
  loading: boolean;
  error: string | null;
  addMenuItem: (item: Omit<MenuItem, 'id' | 'imageUrl' | 'imageHint'> & { image: FileList }) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem> & { image?: FileList }) => void;
  deleteMenuItem: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;
  placeOrder: (items: OrderItem[], customerInfo: CustomerInfo) => Order;
  updateOrderStatus: (id: string, status: Order['status']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialCategories: Category[] = [
  { id: 'pizza', name: 'Pizza' },
  { id: 'pasta', name: 'Pasta' },
  { id: 'salads', name: 'Salads' },
  { id: 'burgers', name: 'Burgers' },
  { id: 'desserts', name: 'Desserts' },
];

const initialMenuItems: MenuItem[] = [
  { id: PlaceHolderImages[0].id, name: 'Margherita Pizza', description: PlaceHolderImages[0].description, price: 12.99, category: 'pizza', imageUrl: PlaceHolderImages[0].imageUrl, imageHint: PlaceHolderImages[0].imageHint, isAvailable: true, isVeg: true, isSpicy: false, isChefsSpecial: false },
  { id: PlaceHolderImages[1].id, name: 'Pasta Carbonara', description: PlaceHolderImages[1].description, price: 15.50, category: 'pasta', imageUrl: PlaceHolderImages[1].imageUrl, imageHint: PlaceHolderImages[1].imageHint, isAvailable: true, isVeg: false, isSpicy: false, isChefsSpecial: false },
  { id: PlaceHolderImages[2].id, name: 'Spicy Arrabbiata', description: PlaceHolderImages[2].description, price: 14.00, category: 'pasta', imageUrl: PlaceHolderImages[2].imageUrl, imageHint: PlaceHolderImages[2].imageHint, isAvailable: true, isVeg: true, isSpicy: true, isChefsSpecial: false },
  { id: PlaceHolderImages[3].id, name: 'Veggie Delight Pizza', description: PlaceHolderImages[3].description, price: 14.50, category: 'pizza', imageUrl: PlaceHolderImages[3].imageUrl, imageHint: PlaceHolderImages[3].imageHint, isAvailable: true, isVeg: true, isSpicy: false, isChefsSpecial: false },
  { id: PlaceHolderImages[4].id, name: "Chef's Risotto", description: PlaceHolderImages[4].description, price: 18.00, category: 'pasta', imageUrl: PlaceHolderImages[4].imageUrl, imageHint: PlaceHolderImages[4].imageHint, isAvailable: false, isVeg: false, isSpicy: false, isChefsSpecial: true },
  { id: PlaceHolderImages[5].id, name: 'Classic Burger', description: PlaceHolderImages[5].description, price: 11.99, category: 'burgers', imageUrl: PlaceHolderImages[5].imageUrl, imageHint: PlaceHolderImages[5].imageHint, isAvailable: true, isVeg: false, isSpicy: false, isChefsSpecial: false },
  { id: PlaceHolderImages[6].id, name: 'Caesar Salad', description: PlaceHolderImages[6].description, price: 9.50, category: 'salads', imageUrl: PlaceHolderImages[6].imageUrl, imageHint: PlaceHolderImages[6].imageHint, isAvailable: true, isVeg: true, isSpicy: false, isChefsSpecial: false },
  { id: PlaceHolderImages[7].id, name: 'Chocolate Lava Cake', description: PlaceHolderImages[7].description, price: 8.00, category: 'desserts', imageUrl: PlaceHolderImages[7].imageUrl, imageHint: PlaceHolderImages[7].imageHint, isAvailable: true, isVeg: true, isSpicy: false, isChefsSpecial: false },
];

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching data from Firestore
    setTimeout(() => {
      setMenuItems(initialMenuItems);
      setCategories(initialCategories);
      setLoading(false);
    }, 1000);
  }, []);

  const addMenuItem = (item: Omit<MenuItem, 'id' | 'imageUrl' | 'imageHint'> & { image: FileList }) => {
    const newId = `new-item-${Date.now()}`;
    const newItem: MenuItem = {
      ...item,
      id: newId,
      imageUrl: URL.createObjectURL(item.image[0]),
      imageHint: "custom item",
    };
    setMenuItems(prev => [newItem, ...prev]);
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem> & { image?: FileList }) => {
    setMenuItems(prev => prev.map(item => {
      if (item.id === id) {
        const { image, ...rest } = updates;
        const newImageProps = image && image.length > 0
          ? { imageUrl: URL.createObjectURL(image[0]), imageHint: 'custom item' }
          : {};
        return { ...item, ...rest, ...newImageProps };
      }
      return item;
    }));
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== id));
  };
  
  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory = { ...category, id: `cat-${Date.now()}` };
    setCategories(prev => [...prev, newCategory]);
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const placeOrder = (items: OrderItem[], customerInfo: CustomerInfo): Order => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const newOrder: Order = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      items,
      customerInfo,
      total,
      status: 'Pending',
      createdAt: Date.now(),
    };
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };
  
  const updateOrderStatus = (id: string, status: Order['status']) => {
    setOrders(prev => prev.map(order => order.id === id ? { ...order, status } : order));
  };

  const value = {
    menuItems,
    categories,
    orders,
    loading,
    error,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addCategory,
    deleteCategory,
    placeOrder,
    updateOrderStatus
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
