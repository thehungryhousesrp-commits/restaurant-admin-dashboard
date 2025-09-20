"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { type MenuItem, type Category, type Order, type OrderItem, type CustomerInfo } from '@/lib/types';
import { db, storage } from '@/lib/firebase';
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
    const categoriesRef = collection(db, 'categories');
    const categoriesSnap = await getDocs(query(categoriesRef));
    const seededCategoryDocs = [];

    if (categoriesSnap.empty) {
        console.log('Seeding categories...');
        const initialCategories: Omit<Category, 'id'>[] = [
            { name: 'Pizza' }, { name: 'Pasta' }, { name: 'Salads' },
            { name: 'Burgers' }, { name: 'Desserts' },
        ];
        for (const cat of initialCategories) {
            const docRef = doc(collection(db, 'categories'));
            await addDoc(categoriesRef, cat);
            seededCategoryDocs.push({ id: docRef.id, ...cat });
        }
    } else {
        categoriesSnap.forEach(doc => seededCategoryDocs.push({ id: doc.id, ...doc.data() as Omit<Category, 'id'> }));
    }

    const menuItemsRef = collection(db, 'menu-items');
    const menuItemsSnap = await getDocs(query(menuItemsRef));

    if (menuItemsSnap.empty) {
        console.log('Seeding menu items...');
        const batch = writeBatch(db);
        PlaceHolderImages.forEach(item => {
            const { id, ...rest } = item;
            const docRef = doc(menuItemsRef);
            
            // Find the corresponding category ID
            const category = seededCategoryDocs.find(c => c.name.toLowerCase() === rest.category.toLowerCase());

            batch.set(docRef, { ...rest, category: category ? category.id : '' });
        });
        await batch.commit();
        console.log('Seeding menu items complete.');
    }
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
      setError(null);
      try {
        await seedInitialData();

        const unsubscribeCategories = onSnapshot(collection(db, "categories"), (snapshot) => {
          const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
          setCategories(cats);
        }, (err) => {
          console.error("Error fetching categories: ", err);
          setError("Failed to load categories.");
        });

        const unsubscribeMenuItems = onSnapshot(collection(db, "menu-items"), (snapshot) => {
          const items = snapshot.docs.map(doc => {
            const data = doc.data();
            // Find category name from category ID
            const categoryName = categories.find(c => c.id === data.category)?.name || 'Uncategorized';
            return { id: doc.id, ...data, category: categoryName } as MenuItem;
          });
          setMenuItems(items);
          setLoading(false);
        }, (err) => {
          console.error("Error fetching menu items: ", err);
          setError("Failed to load menu items.");
          setLoading(false);
        });
        
        // Note: Orders are still in-memory. They can be moved to Firestore next.
        
        return () => {
          unsubscribeMenuItems();
          unsubscribeCategories();
        };

      } catch (err) {
        console.error("Initialization error: ", err);
        setError("Failed to initialize app data.");
        setLoading(false);
      }
    }

    initializeData();
  }, [categories]);

  const uploadImage = async (imageFile: File): Promise<string> => {
    const storageRef = ref(storage, `menu-images/${Date.now()}-${imageFile.name}`);
    const snapshot = await uploadBytes(storageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  }

  const addMenuItem = async (item: Omit<MenuItem, 'id' | 'imageUrl' | 'imageHint'> & { image: FileList }) => {
    try {
      const imageUrl = await uploadImage(item.image[0]);
      const newItemData = {
        ...item,
        imageUrl: imageUrl,
        imageHint: 'custom item'
      };
      // @ts-ignore
      delete newItemData.image;
      await addDoc(collection(db, 'menu-items'), newItemData);
    } catch (e) {
      console.error("Error adding document: ", e);
      setError("Failed to add menu item.");
      throw e;
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem> & { image?: FileList }) => {
     try {
      const itemDoc = doc(db, 'menu-items', id);
      const { image, ...rest } = updates;
      let newImageProps = {};
      if (image && image.length > 0) {
        const newImageUrl = await uploadImage(image[0]);
        newImageProps = { imageUrl: newImageUrl, imageHint: 'custom item' };
      }
      await updateDoc(itemDoc, { ...rest, ...newImageProps });
    } catch (e) {
      console.error("Error updating document: ", e);
      setError("Failed to update menu item.");
      throw e;
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
    // Optional: Check if any menu items are using this category before deleting.
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
