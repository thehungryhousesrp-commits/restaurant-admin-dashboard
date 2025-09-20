"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { type MenuItem, type Category, type Order, type OrderItem, type CustomerInfo } from '@/lib/types';
import { db, auth, storage } from '@/lib/firebase';
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
import { 
  ref, 
  uploadString, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User
} from "firebase/auth";
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface AppContextType {
  user: User | null;
  loadingAuth: boolean;
  menuItems: MenuItem[];
  categories: Category[];
  orders: Order[];
  loading: boolean;
  error: string | null;
  addMenuItem: (item: Omit<MenuItem, 'id' | 'imageUrl' | 'imageHint'> & { imageUrl: string }) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<MenuItem> & { imageUrl?: string }) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  placeOrder: (items: OrderItem[], customerInfo: CustomerInfo) => Order;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  login: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<any>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to upload an image, returning the download URL
async function uploadImage(dataUri: string, itemId: string): Promise<string> {
    const storageRef = ref(storage, `menu-images/${itemId}-${Date.now()}`);
    // 'data_url' is the format for Base64 data URI
    const uploadResult = await uploadString(storageRef, dataUri, 'data_url');
    return getDownloadURL(uploadResult.ref);
}

// Helper to seed initial data if collections are empty
async function seedInitialData() {
    const categoriesRef = collection(db, 'categories');
    const menuItemsRef = collection(db, 'menu-items');

    const categoriesSnap = await getDocs(query(categoriesRef));
    const menuItemsSnap = await getDocs(query(menuItemsRef));

    // Only seed if both collections are empty
    if (categoriesSnap.empty && menuItemsSnap.empty) {
        console.log('Database is empty. Seeding initial data...');
        const batch = writeBatch(db);
        const seededCategoryDocs: Category[] = [];

        const initialCategories: Omit<Category, 'id'>[] = [
            { name: 'Pizza' }, { name: 'Pasta' }, { name: 'Salads' },
            { name: 'Burgers' }, { name: 'Desserts' },
        ];

        // Create categories and store their new IDs
        for (const cat of initialCategories) {
            const catDocRef = doc(collection(db, "categories"));
            batch.set(catDocRef, cat);
            seededCategoryDocs.push({ id: catDocRef.id, ...cat });
        }
        
        // Create menu items using the new category IDs
        PlaceHolderImages.forEach(item => {
            const { id, ...rest } = item;
            const menuItemDocRef = doc(collection(db, "menu-items"));
            
            const category = seededCategoryDocs.find(c => c.name.toLowerCase() === rest.category.toLowerCase());
            
            batch.set(menuItemDocRef, { ...rest, category: category ? category.id : '' });
        });

        await batch.commit();
        console.log('Seeding complete.');
    } else {
        console.log('Database already contains data. Skipping seed.');
    }
}


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoadingAuth(false);
    });

    return () => unsubscribeAuth();
  }, []);


  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setError(null);
      try {
        await seedInitialData();

        const unsubscribeCategories = onSnapshot(query(collection(db, "categories")), (snapshot) => {
          const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
          setCategories(cats);
        }, (err) => {
          console.error("Error fetching categories: ", err);
          setError("Failed to load categories.");
        });

        const unsubscribeMenuItems = onSnapshot(query(collection(db, "menu-items")), (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
          setMenuItems(items);
          setLoading(false);
        }, (err) => {
          console.error("Error fetching menu items: ", err);
          setError("Failed to load menu items.");
          setLoading(false);
        });
        
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
  }, []);

  const addMenuItem = async (item: Omit<MenuItem, 'id' | 'imageHint' | 'imageUrl'> & { imageUrl: string }) => {
    try {
        const docRef = doc(collection(db, 'menu-items'));
        const imageUrl = await uploadImage(item.imageUrl, docRef.id);

        const newItemData = {
            ...item,
            imageUrl,
            imageHint: 'custom item'
        };
        await addDoc(collection(db, 'menu-items'), newItemData);

    } catch (e) {
      console.error("Error adding document: ", e);
      setError("Failed to add menu item.");
      throw e;
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem> & { imageUrl?: string }) => {
     try {
      const itemDoc = doc(db, 'menu-items', id);
      let finalUpdates: Partial<MenuItem> = { ...updates };
      
      // If a new image data URI is provided, upload it and update the URL
      if (updates.imageUrl && updates.imageUrl.startsWith('data:image')) {
        const newImageUrl = await uploadImage(updates.imageUrl, id);
        finalUpdates.imageUrl = newImageUrl;
        finalUpdates.imageHint = 'custom item';
      }

      await updateDoc(itemDoc, finalUpdates);
    } catch (e) {
      console.error("Error updating document: ", e);
      setError("Failed to update menu item.");
      throw e;
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
        // First, delete the image from storage if it's a firebase URL
        const itemToDelete = menuItems.find(item => item.id === id);
        if (itemToDelete && itemToDelete.imageUrl.includes('firebasestorage')) {
            try {
                const imageRef = ref(storage, itemToDelete.imageUrl);
                await deleteObject(imageRef);
            } catch (storageError) {
                // Log error but don't block firestore deletion
                console.error("Could not delete image from storage: ", storageError);
            }
        }
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
    return newOrder;
  };
  
  const updateOrderStatus = (id: string, status: Order['status']) => {
    setOrders(prev => prev.map(order => order.id === id ? { ...order, status } : order));
  };
  
  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    loadingAuth,
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
    updateOrderStatus,
    login,
    logout
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