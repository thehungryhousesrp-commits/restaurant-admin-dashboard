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
  getDoc,
  writeBatch,
  setDoc,
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
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });

    const fetchInitialData = async () => {
        setLoading(true);
        setError(null);
        try {
            const menuQuery = query(collection(db, "menu-items"));
            const categoryQuery = query(collection(db, "categories"));
            const ordersQuery = query(collection(db, "orders"));

            const menuSnapshot = onSnapshot(menuQuery, (snapshot) => {
                const items: MenuItem[] = [];
                snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as MenuItem));
                setMenuItems(items);
                setLoading(false);
            }, (err) => {
                console.error("Error fetching menu items:", err);
                setError("Failed to load menu data. Please check your connection and Firestore rules.");
                setLoading(false);
            });
            
            const categorySnapshot = onSnapshot(categoryQuery, (snapshot) => {
                const cats: Category[] = [];
                snapshot.forEach(doc => cats.push({ id: doc.id, ...doc.data() } as Category));
                setCategories(cats);
            }, (err) => {
                console.error("Error fetching categories:", err);
            });
            
            const orderSnapshot = onSnapshot(ordersQuery, (snapshot) => {
                const ords: Order[] = [];
                snapshot.forEach(doc => ords.push({ id: doc.id, ...doc.data() } as Order));
                setOrders(ords);
            }, (err) => {
                console.error("Error fetching orders:", err);
            });

            return () => {
                menuSnapshot();
                categorySnapshot();
                orderSnapshot();
            };
        } catch (err) {
            console.error(err);
            setError("Failed to initialize data fetching.");
            setLoading(false);
        }
    };
    
    fetchInitialData();

    return () => unsubscribeAuth();
  }, []);

  const addMenuItem = async (item: Omit<MenuItem, 'id' | 'imageHint'>) => {
    try {
      const itemWithHint = {
        ...item,
        imageHint: item.name.toLowerCase().split(' ').slice(0, 2).join(' '),
      };
      await addDoc(collection(db, 'menu-items'), itemWithHint);
    } catch (e) {
      console.error("Error adding document: ", e);
      throw e;
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      const itemDoc = doc(db, 'menu-items', id);
      await updateDoc(itemDoc, updates);
    } catch (e) {
      console.error("Error updating document: ", e);
      throw e;
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'menu-items', id));
    } catch (e) {
      console.error("Error deleting document: ", e);
      throw e;
    }
  };
  
  const addCategory = async (category: Omit<Category, 'id'>) => {
    try {
        const existingCategory = categories.find(c => c.name.toLowerCase() === category.name.toLowerCase());
        if(existingCategory) {
            console.warn("Category already exists");
            return;
        }
      await addDoc(collection(db, 'categories'), category);
    } catch (e) {
      console.error("Error adding category: ", e);
      throw e;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const itemsInCategory = menuItems.filter(item => item.category === id);
      if (itemsInCategory.length > 0) {
        // We will now allow deleting categories and will re-categorize items.
        const batch = writeBatch(db);
        const uncategorized = categories.find(c => c.name === "Uncategorized");
        let uncategorizedId = uncategorized ? uncategorized.id : null;

        if (!uncategorizedId) {
            const newCategoryRef = doc(collection(db, "categories"));
            batch.set(newCategoryRef, { name: "Uncategorized" });
            uncategorizedId = newCategoryRef.id;
        }

        itemsInCategory.forEach(item => {
            const itemRef = doc(db, 'menu-items', item.id);
            batch.update(itemRef, { category: uncategorizedId });
        });
        
        await batch.commit();
      }
      await deleteDoc(doc(db, 'categories', id));
    } catch (e) {
      console.error("Error deleting category: ", e);
      throw e;
    }
  };

  const placeOrder = async (items: OrderItem[], customerInfo: CustomerInfo): Promise<Order> => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    const total = Math.round(subtotal + cgst + sgst);
    const createdAt = Date.now();

    const orderData: Omit<Order, 'id'> = {
        items: items.map(({ id, name, price, quantity, isVeg }) => ({
            itemId: id,
            name,
            price,
            quantity,
            isVeg
        })),
        customerInfo,
        subtotal,
        cgst,
        sgst,
        total,
        status: 'Pending',
        createdAt,
        createdBy: auth.currentUser ? auth.currentUser.uid : null,
    };

    try {
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        return { id: docRef.id, ...orderData };
    } catch (e) {
        console.error("Error placing order: ", e);
        throw new Error("Could not place order.");
    }
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    try {
      const orderDoc = doc(db, 'orders', id);
      await updateDoc(orderDoc, { status });
    } catch (e) {
      console.error("Error updating order status: ", e);
      throw e;
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'orders', id));
    } catch (e) {
      console.error("Error deleting order: ", e);
      throw e;
    }
  };
  
  const login = async (email:string, pass: string) => {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;

      // After successful login, set the user's role in Firestore.
      // This is crucial for the security rules to work.
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { email: user.email, role: 'admin' }, { merge: true });
      }
      return userCredential;
  };
  
  const logout = async () => {
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
    logout,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
