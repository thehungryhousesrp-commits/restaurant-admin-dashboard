
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type MenuItem, type Category, type Table } from '@/lib/types';

interface AppContextType {
  menuItems: MenuItem[];
  categories: Category[];
  tables: Table[];
  menuLoading: boolean;
  categoriesLoading: boolean;
  tablesLoading: boolean;
}

export const AppContext = createContext<AppContextType>({
  menuItems: [],
  categories: [],
  tables: [],
  menuLoading: true,
  categoriesLoading: true,
  tablesLoading: true,
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [tablesLoading, setTablesLoading] = useState(true);

  useEffect(() => {
    const unsubscribeMenuItems = onSnapshot(collection(db, 'menu-items'), (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        // **Data Sanitization and Pass-through**
        return {
          id: doc.id,
          name: data.name || 'Unnamed Item',
          description: data.description || '',
          price: data.price || 0,
          category: data.category || 'uncategorized',
          // Directly pass the value from DB. The UI will handle 'undefined'.
          isAvailable: data.isAvailable, 
          isVeg: data.isVeg,
        } as MenuItem;
      });
      setMenuItems(items);
      setMenuLoading(false);
    }, (error) => {
      console.error("Error fetching menu items: ", error);
      setMenuLoading(false);
    });

    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(cats);
      setCategoriesLoading(false);
    }, (error) => {
      console.error("Error fetching categories: ", error);
      setCategoriesLoading(false);
    });

    const unsubscribeTables = onSnapshot(collection(db, 'tables'), (snapshot) => {
      const tbls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));
      setTables(tbls);
      setTablesLoading(false);
    }, (error) => {
      console.error("Error fetching tables: ", error);
      setTablesLoading(false);
    });

    return () => {
      unsubscribeMenuItems();
      unsubscribeCategories();
      unsubscribeTables();
    };
  }, []);

  const value = {
    menuItems,
    categories,
    tables,
    menuLoading,
    categoriesLoading,
    tablesLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
