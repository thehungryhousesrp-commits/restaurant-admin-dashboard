"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { type MenuItem, type Category, type Order, type OrderItem, type CustomerInfo } from '@/lib/types';
import { db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface AppContextType {
  menuItems: MenuItem[];
  categories: Category[];
  orders: Order[];
  loading: boolean;
  error: string | null;
  addMenuItem: (item: Omit<MenuItem, 'id' | 'imageUrl' | 'imageHint'> & { image: FileList }) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<MenuItem> & { image?: FileList }) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  placeOrder: (items: OrderItem[], customerInfo: CustomerInfo) => Order;
  updateOrderStatus: (id: string, status: Order['status']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to seed initial data if collections are empty
async function seedInitialData() {
  const menuItemsRef = collection(db, 'menu-items');
  const categoriesRef = collection(db, 'categories');

  const menuItemsSnap = await getDocs(query(menuItemsRef));
  const categoriesSnap = await getDocs(query(categoriesRef));

  const batch = writeBatch(db);

  if (categoriesSnap.empty) {
    console.log('Seeding categories...');
    const initialCategories: Omit<Category, 'id'>[] = [
      { name: 'Pizza' }, { name: 'Pasta' }, { name: 'Salads' },
      { name: 'Burgers' }, { name: 'Desserts' },
    ];
    initialCategories.forEach(cat => {
      const docRef = doc(collection(db, 'categories'));
      batch.set(docRef, cat);
    });
  }

  if (menuItemsSnap.empty) {
    console.log('Seeding menu items...');
    PlaceHolderImages.forEach(item => {
      const { id, ...rest } = item; // placeholder ID is not needed
      const docRef = doc(collection(db, 'menu-items'));
      const categoryName = rest.category;
      
      // We need to find the category ID from the initial data.
      // This is a bit of a hack for seeding, in a real app you'd have better relations.
      const categoryMap: { [key: string]: string } = {
          'pizza': 'Pizza',
          'pasta': 'Pasta',
          'salads': 'Salads',
          'burgers': 'Burgers',
          'desserts': 'Desserts',
      };
      
      const categoryId = Object.keys(categoryMap).find(key => categoryMap[key].toLowerCase() === categoryName.toLowerCase()) || 'pizza';

      batch.set(docRef, { ...rest, category: categoryId });
    });
  }
  
  await batch.commit();
  console.log('Seeding complete.');
}


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await seedInitialData();

      const unsubscribeMenuItems = onSnapshot(collection(db, "menu-items"), (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
        setMenuItems(items);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching menu items: ", err);
        setError("Failed to load menu items.");
        setLoading(false);
      });

      const unsubscribeCategories = onSnapshot(collection(db, "categories"), (snapshot) => {
        const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        
        // This is a temp fix to map category ID to name for display in menu list
        setMenuItems(prevItems => prevItems.map(item => {
            const category = cats.find(c => c.id === item.category);
            return {...item, category: category ? category.name : 'Uncategorized'}
        }));

        setCategories(cats);
      }, (err) => {
        console.error("Error fetching categories: ", err);
        setError("Failed to load categories.");
      });
      
      // Note: Orders are still in-memory. They can be moved to Firestore next.
      
      return () => {
        unsubscribeMenuItems();
        unsubscribeCategories();
      };
    }

    initializeData();
  }, []);

  const addMenuItem = async (item: Omit<MenuItem, 'id' | 'imageUrl' | 'imageHint'> & { image: FileList }) => {
    // Note: Image upload to Firebase Storage is not implemented yet.
    // We'll use a local blob URL for now.
    try {
      const imageUrl = URL.createObjectURL(item.image[0]);
      const newItemData = {
        ...item,
        imageUrl: imageUrl, // Replace with storage URL later
        imageHint: 'custom item'
      };
      await addDoc(collection(db, 'menu-items'), newItemData);
    } catch (e) {
      console.error("Error adding document: ", e);
      setError("Failed to add menu item.");
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem> & { image?: FileList }) => {
     try {
      const itemDoc = doc(db, 'menu-items', id);
      const { image, ...rest } = updates;
      let newImageProps = {};
      if (image && image.length > 0) {
        // Image upload logic to be added here. For now, use blob URL.
        newImageProps = { imageUrl: URL.createObjectURL(image[0]), imageHint: 'custom item' };
      }
      await updateDoc(itemDoc, { ...rest, ...newImageProps });
    } catch (e) {
      console.error("Error updating document: ", e);
      setError("Failed to update menu item.");
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'menu-items', id));
    } catch(e) {
        console.error("Error deleting document: ", e);
        setError("Failed to delete menu item.");
    }
  };
  
  const addCategory = async (category: Omit<Category, 'id'>) => {
    try {
      await addDoc(collection(db, 'categories'), category);
    } catch (e) {
      console.error("Error adding category: ", e);
      setError("Failed to add category.");
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch(e) {
        console.error("Error deleting category: ", e);
        setError("Failed to delete category.");
    }
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
    // TODO: Save order to Firestore
    return newOrder;
  };
  
  const updateOrderStatus = (id: string, status: Order['status']) => {
    setOrders(prev => prev.map(order => order.id === id ? { ...order, status } : order));
    // TODO: Update order status in Firestore
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
