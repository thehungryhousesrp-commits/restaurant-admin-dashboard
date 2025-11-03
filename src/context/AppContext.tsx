'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { type MenuItem, type Category, type Order, type OrderItem, type CustomerInfo, type Table } from '@/lib/types';
import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  writeBatch,
  getDocs,
  orderBy
} from 'firebase/firestore';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User
} from "firebase/auth";

interface AppContextType {
  user: User | null;
  loadingAuth: boolean;
  menuItems: MenuItem[];
  categories: Category[];
  orders: Order[];
  tables: Table[];
  loading: boolean;
  error: string | null;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  deleteMenuItems: (ids: string[]) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category | undefined>;
  deleteCategory: (id: string) => Promise<void>;
  addTable: (table: Omit<Table, 'id' | 'status'>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  updateTableStatus: (id: string, status: Table['status']) => Promise<void>;
  placeOrder: (items: OrderItem[], customerInfo: CustomerInfo, table?: Table) => Promise<Order>;
  placeKOT: (items: OrderItem[], customerInfo: CustomerInfo, table?: Table) => Promise<Order>;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  deleteOrder: (id: string) => Promise<void>;
  deleteAllMenuData: () => Promise<void>;
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
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const menuQuery = query(collection(db, "menu-items"));
    const categoryQuery = query(collection(db, "categories"));
    const tableQuery = query(collection(db, "tables"));

    const menuUnsubscribe = onSnapshot(menuQuery, (snapshot) => {
        const items: MenuItem[] = [];
        snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as MenuItem));
        setMenuItems(items);
        setLoading(false);
    }, (err) => {
        console.error("Error fetching menu items:", err);
        setError("Failed to load menu data.");
        setLoading(false);
    });
    
    const categoryUnsubscribe = onSnapshot(categoryQuery, (snapshot) => {
        const cats: Category[] = [];
        snapshot.forEach(doc => cats.push({ id: doc.id, ...doc.data() } as Category));
        setCategories(cats);
    }, (err) => {
        console.error("Error fetching categories:", err);
    });
    
    const tableUnsubscribe = onSnapshot(tableQuery, (snapshot) => {
        const tbls: Table[] = [];
        snapshot.forEach(doc => tbls.push({ id: doc.id, ...doc.data() } as Table));
        setTables(tbls);
    }, (err) => {
        console.error("Error fetching tables:", err);
    });

    let ordersUnsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
      
      if (currentUser) {
        const ordersQuery = query(collection(db, "orders"), orderBy('createdAt', 'desc'));
        ordersUnsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            const ords: Order[] = [];
            snapshot.forEach(doc => ords.push({ id: doc.id, ...doc.data() } as Order));
            setOrders(ords);
        }, (err) => {
            console.error("Error fetching orders:", err);
            setOrders([]);
        });
      } else {
        if (ordersUnsubscribe) {
          ordersUnsubscribe();
        }
        setOrders([]);
      }
    });

    return () => {
      authUnsubscribe();
      menuUnsubscribe();
      categoryUnsubscribe();
      tableUnsubscribe();
      if (ordersUnsubscribe) {
        ordersUnsubscribe();
      }
    };
  }, []);

  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    try {
      const payload = {
        ...item,
        isAvailable: item.isAvailable ?? true,
        isVeg: item.isVeg ?? true,
        isSpicy: item.isSpicy ?? false,
        isChefsSpecial: item.isChefsSpecial ?? false,
      };
      await addDoc(collection(db, 'menu-items'), payload);
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
  
  const deleteMenuItems = async (ids: string[]) => {
      const batch = writeBatch(db);
      ids.forEach(id => {
          const itemDoc = doc(db, 'menu-items', id);
          batch.delete(itemDoc);
      });
      await batch.commit();
  }
  
  const addCategory = async (category: Omit<Category, 'id'>): Promise<Category | undefined> => {
    try {
        const existingCategory = categories.find(c => c.name.toLowerCase() === category.name.toLowerCase());
        if(existingCategory) {
            console.warn("Category already exists");
            return existingCategory;
        }
      const docRef = await addDoc(collection(db, 'categories'), category);
      return { id: docRef.id, ...category };
    } catch (e) {
      console.error("Error adding category: ", e);
      throw e;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const itemsInCategory = menuItems.filter(item => item.category === id);
      if (itemsInCategory.length > 0) {
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
  
  const addTable = async (table: Omit<Table, 'id' | 'status'>) => {
    try {
      await addDoc(collection(db, 'tables'), { ...table, status: 'available' });
    } catch (e) {
      console.error("Error adding table: ", e);
      throw e;
    }
  };

  const deleteTable = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tables', id));
    } catch (e) {
      console.error("Error deleting table: ", e);
      throw e;
    }
  };

  const updateTableStatus = async (id: string, status: Table['status']) => {
    try {
      const tableDoc = doc(db, 'tables', id);
      await updateDoc(tableDoc, { status });
    } catch (e) {
      console.error("Error updating table status: ", e);
      throw e;
    }
  };

  const deleteAllMenuData = async () => {
    const batch = writeBatch(db);
    
    const menuItemsSnapshot = await getDocs(collection(db, 'menu-items'));
    menuItemsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    categoriesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
  }
  
  const createOrderObject = (items: OrderItem[], customerInfo: CustomerInfo, table?: Table): Omit<Order, 'id'> => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    const total = Math.round(subtotal + cgst + sgst);
    const createdAt = Date.now();

    return {
        items: items.map(({ id, name, price, quantity }) => ({
            itemId: id,
            name,
            price,
            quantity
        })),
        customerInfo,
        tableId: table?.id,
        tableName: table?.name,
        subtotal,
        cgst,
        sgst,
        total,
        status: 'Pending', // Default status
        createdAt,
        createdBy: auth.currentUser ? auth.currentUser.uid : null,
    };
  }

  const placeOrder = async (items: OrderItem[], customerInfo: CustomerInfo, table?: Table): Promise<Order> => {
    const orderData = createOrderObject(items, customerInfo, table);
    orderData.status = 'Billed';

    try {
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        if (table) await updateTableStatus(table.id, 'available');
        return { id: docRef.id, ...orderData };
    } catch (e) {
        console.error("Error placing order: ", e);
        throw new Error("Could not place order.");
    }
  };

  const placeKOT = async (items: OrderItem[], customerInfo: CustomerInfo, table?: Table): Promise<Order> => {
    const orderData = createOrderObject(items, customerInfo, table);
    orderData.status = 'Preparing';

    try {
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        if (table) await updateTableStatus(table.id, 'occupied');
        return { id: docRef.id, ...orderData };
    } catch (e) {
        console.error("Error placing KOT: ", e);
        throw new Error("Could not place KOT.");
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
  
  const login = (email:string, pass: string) => {
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
    tables,
    loading,
    error,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    deleteMenuItems,
    addCategory,
    deleteCategory,
    addTable,
    deleteTable,
    updateTableStatus,
    deleteAllMenuData,
    placeOrder,
    placeKOT,
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
