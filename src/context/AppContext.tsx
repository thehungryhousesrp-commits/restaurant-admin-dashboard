"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { type MenuItem, type Category, type Order, type OrderItem, type CustomerInfo } from '@/lib/types';
import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
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
  addMenuItem: (item: Omit<MenuItem, 'id' | 'imageHint'>) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<Omit<MenuItem, 'id' | 'imageHint'>>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  placeOrder: (items: OrderItem[], customerInfo: CustomerInfo) => Promise<Order>;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  deleteOrder: (id: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<any>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to seed initial data if collections are empty
async function seedInitialData() {
    const categoriesRef = collection(db, 'categories');
    const menuItemsRef = collection(db, 'menu-items');

    try {
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
    } catch (e) {
        console.error("Error during initial data seed check:", e);
        // This might happen if rules are not set up yet. We can ignore it on first run.
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

  // Effect for Authentication
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoadingAuth(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Effect for Public Data (Menu & Categories)
  useEffect(() => {
    setLoading(true);
    
    const initializePublicData = async () => {
        await seedInitialData();

        const qCategories = query(collection(db, "categories"));
        const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
          const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
          setCategories(cats);
        }, (err) => {
          console.error("Error fetching categories: ", err);
          setError("Failed to load categories. Check Firestore security rules.");
        });

        const qMenuItems = query(collection(db, "menu-items"));
        const unsubscribeMenuItems = onSnapshot(qMenuItems, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
          setMenuItems(items);
          setLoading(false); 
        }, (err) => {
          console.error("Error fetching menu items: ", err);
          setError("Failed to load menu items. Check Firestore security rules.");
          setLoading(false);
        });
        
        return () => {
            unsubscribeCategories();
            unsubscribeMenuItems();
        };
    }

    const cleanupPromise = initializePublicData();

    return () => {
        cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, []);

  // Effect for Admin-Only Data (Orders)
  useEffect(() => {
      if (user) {
          // User is logged in, subscribe to orders
          const qOrders = query(collection(db, "orders"));
          const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
              const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
              setOrders(fetchedOrders);
          }, (err) => {
              console.error("Error fetching orders (admin): ", err);
              // Don't set a global error for this, as public data might be fine.
              // Maybe show a small indicator in the admin UI instead.
          });

          return () => unsubscribeOrders();
      } else {
          // User is not logged in, clear orders
          setOrders([]);
      }
  }, [user]); // This effect depends only on the user's auth state

  const addMenuItem = async (item: Omit<MenuItem, 'id' | 'imageHint'>) => {
    try {
        const payload = {
            ...item,
            imageHint: item.name.toLowerCase().split(' ').slice(0, 2).join(' '),
        }
        await addDoc(collection(db, 'menu-items'), payload);
    } catch (e) {
      console.error("Error adding document: ", e);
      setError("Failed to add menu item.");
      throw e;
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<Omit<MenuItem, 'id' | 'imageHint'>>) => {
     try {
      const itemDoc = doc(db, 'menu-items', id);
      const payload: Partial<MenuItem> = {
        ...updates,
      };
      if (updates.name) {
        payload.imageHint = updates.name.toLowerCase().split(' ').slice(0, 2).join(' ');
      }
      await updateDoc(itemDoc, payload);
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
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch(e) {
        console.error("Error deleting category: ", e);
        setError("Failed to delete category.");
    }
  };

  const placeOrder = async (items: OrderItem[], customerInfo: CustomerInfo): Promise<Order> => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    const total = Math.round(subtotal + cgst + sgst);
    
    const newOrderData: Omit<Order, 'id'> = {
      items,
      customerInfo,
      subtotal,
      cgst,
      sgst,
      total,
      status: 'Pending',
      createdAt: Date.now(),
    };

    try {
      const docRef = await addDoc(collection(db, 'orders'), newOrderData);
      return { id: docRef.id, ...newOrderData };
    } catch (error) {
      console.error("Error placing order: ", error);
      setError("Failed to place order.");
      throw error;
    }
  };
  
  const updateOrderStatus = async (id: string, status: Order['status']) => {
    try {
        const orderDoc = doc(db, 'orders', id);
        await updateDoc(orderDoc, { status });
    } catch (error) {
        console.error("Error updating order status: ", error);
        setError("Failed to update order status.");
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'orders', id));
    } catch(e) {
        console.error("Error deleting order: ", e);
        setError("Failed to delete order.");
        throw e;
    }
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
    deleteOrder,
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
