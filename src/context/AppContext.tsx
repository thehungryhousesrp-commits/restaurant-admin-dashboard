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
  logoDataUri: string;
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

// Hardcoded fallback data URI in case Firestore fetch fails
const fallbackLogoDataUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAEBAQEBAQEBAQEBAQEBAQIBAQEBAQIBAQECAgICAgICAgIDAwQDAwMDAwICAwQDAwQEBAQEAgMFBQQEBQQEBAT/2wBDAQEBAQEBAQIBAQIEAwIDBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAT/wAARCAQ4BDoDASIAAhEBAxEB/8QAHwABAAAGAwEBAAAAAAAAAAAAAAECAwkKCwYHCAQF/8QAcxAAAQMDAgQDBQQEBgYSCgwPAQACAwQFEQYHCBIhMQlBUQoTImFxFDKBkRVCofAWIyRSscEXJjNitNEYJTQ1Njc5Q1NydXaCkrO24fEZJylEdHijpKbSGig4VGNkc4OWoqWytcLFRlZlZoSTlEdIVXeV/8QAHgEBAAICAgMBAAAAAAAAAAAAAAECAwkHCAQGCgX/xABbEQABAwIDBQQECgMLCAkEAgMBAAIDBBEFBgcIEiExQRNRYXEJIjKBFCMzQlKRobHR8GJywRUWJENTY3OCkrKzJTSDk6LC4fEXRFRklKO0w9MmKDXSdKQYVYT/2gAMAwEAAhEDEQA/AM/hERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERETt3RERcXvGtdKWAON5v1tt4aMuNTUtjAXUGpOKvh+0xS1M113V0jSPgjLvdyXNnOSPLCIvQ6gSACSQABkknACsf7++MrsdtW2tNq1bZbyabmwKSuYS7l9Ov75VkXfv2qLTujvt1ns+mKquc7mjZUUtU3Bx08kRZrtdqnTdsz+kb7aqLl+99qro4cfXJXE6reXaeiz9r3G0bTY6H3+oKaPH5vWsa399pE11ucKuOyUl3tRmDgxxqz8Oe3Yq0Fup4pvEfriSpNt13d7e2VxdgVcuRnP8AfIi28+5PGpsboaOZzNztFVbomcxbDeoJj9Mhyt4bn+NNszoMVJjv9mrvcA/5nq4n82PxWqAuHGfxG3QEV25F7qA7Oeepec5/4S4LceIbdu6832/V9yqObvzzuOf2oi2U253tPW0+gvtAjtsld7nP+Z42yZwvDmsvbBNAvdPb6DRl9AblplZRYa7uPILACuOvNUXXP2+6VE/N35nnquJSyvmeZJHFzj3J6lEWcJqv2rK1Xr3xpdM3lnPnl56Uryzq/wBpIrb66Z1LZK5nvCcc9KemViOoiLJD1b48WsL8JfstA6PnzymSlIxlecL54xG5tzlkdHFTta52RmmOVZLREV3Kv8V3dqqa4RijBI6E0/ywuFV3id7z1PNySW8ZzjNN9FbCREVwO6eItvlWtc2OotjQ4nJNPkj9q4iePLfUkn9IWvqc/wCYf+leKkRF77sviIb523DZKq2SAHoRTcv7Mrse1eJ/vNRFpkfQHAx8NPn+tWvUUgXRXirX4tu69GWulbSEgjOKY9V3JprxrNwrQ6M1FMx4b1PLTf1Kwj+OFHA9R+1TunmEWTrpj2gTUtm92aq2TP5D1DKQnOF6J0x7SzPZzCamw17+TGeSlPT9ixAETdKLOd0V7V9ZNPOidV6XvUnI4F3u6Q9vl0XsDRftfO294dDR1ej7zDIMML56PBPlkkha6JfXS11TRuD6eRzHA5BacKtkW0Z0J7TZtNq4wB9A+k99j+7NYwNz6r3Ft543uzes3UwkvVqoxPj+71MbOXPqtRfR7h6st5BpLtUw8vbleR27Ll9Bv9urbMfYtV3CHl7cszun7URbqfbPjz2N142Av3I0dQiXGftF3hiIz9XL05R72bQ17WuotytFVIcMj3OoaaQn8A9aPO38YfELa8fYdxL1T8vbkqXjGP8AhL0Vtb4mnEtolzTXbg3mujbJzNDquTmA/wCMiLdSUuv9EVxAo9Wafqi7sILrDJn8nLk1PVU1Wz3lLUQ1DP50Mgkb+xak/abx7d2NCTUsl0rbvcRA4Ej7W74sH5lXeNifatp9PijtN60pdakkNidO6rHKPU9URbEBFivbC+0U7a7ofYm3X7PZjUcoe6qq2YGe+evzV5jZ/wARTh03Goaeeo3P0vQTzgfxM1ewOGQPmiK4Si6ss2920+oQw2bXmnbiJPufZrgx/Nnthdk0lbSV8TZ6OoiqYnDLZInh7SiL6kRERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERSucGNLnHAAyfNEUyLp/WW+22Wgmyv1PqSktohz7z38jWcuO/cq3NxD+Lrw5bUWysms2trNXV1LG7ETq2LDiAfLKIruNTV09HE6apmZDGwZc57sAALp7UvENs9pH3o1Bre0W4w594JpgC3CwlOLT2o+96ZfcrHpC32SthkL6eOeJxc/r0B6FY2PEx40O9W+09wmh1Bc7J9s5iG2+qfEG5z2RFs3N9fFL4ats7bNPadxLJc6yGNxdTtqmDBHl3+SsLcSHtNdh23Nxo9OWm33b3RcyOWOs6ux08itc7qTf7eDUNfV1Vw3H1XWNqZTIWzXWUtGSemMrrW4amv91JdcrtW1rj1Jqah0pP5lEWV1xF+0nbkbsC4U9pt8lmE3Mxj6etcSO4BHVWON5/EV4hty6+app9x7/bYZpXPdDDWPxg+XdW7ySTk9SUTmi7gvG/e719c83bXd9rvedXe+qy4OXW1xv13urzJca+oq3nu6V/MV+Qu0tCbIbw7nVMFJt9tlrfV81SeWE2LTdVXQO64yZQzkA+ZcAvErsQoMMp3VeJTsiibzc9zWNHm5xAHvK/QwzCMVxqqbR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';

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
  const [logoDataUri, setLogoDataUri] = useState<string>(fallbackLogoDataUri);
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

  // Effect for Public Data (Menu, Categories, and Logo)
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
    logoDataUri,
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
