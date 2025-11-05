
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
  restaurantId: string; // Expose restaurantId for other components
}

// ============================================================================
// !!! IMPORTANT DEVELOPMENT NOTE !!!
// This is a temporary, hardcoded restaurant ID for development purposes.
// In a real multi-tenant application, this ID would be dynamically determined
// from the authenticated user's session (e.g., from their JWT claims).
// This allows us to build and test the multi-tenant data structure before
// the full authentication flow is implemented.
const TEMP_DEV_RESTAURANT_ID = "main-restaurant";
// ============================================================================


export const AppContext = createContext<AppContextType>({
  menuItems: [],
  categories: [],
  tables: [],
  menuLoading: true,
  categoriesLoading: true,
  tablesLoading: true,
  restaurantId: TEMP_DEV_RESTAURANT_ID,
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [tablesLoading, setTablesLoading] = useState(true);
  const restaurantId = TEMP_DEV_RESTAURANT_ID;

  useEffect(() => {
    if (!restaurantId) return;

    // Path to collections within the specific restaurant document
    const menuItemsPath = `restaurants/${restaurantId}/menu-items`;
    const categoriesPath = `restaurants/${restaurantId}/categories`;
    const tablesPath = `restaurants/${restaurantId}/tables`;

    const unsubscribeMenuItems = onSnapshot(collection(db, menuItemsPath), (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unnamed Item',
          description: data.description || '',
          price: data.price || 0,
          category: data.category || 'uncategorized',
          isAvailable: data.isAvailable,
          isVeg: data.isVeg,
          restaurantId: restaurantId, // Ensure restaurantId is attached
        } as MenuItem;
      });
      setMenuItems(items);
      setMenuLoading(false);
    }, (error) => {
      console.error(`Error fetching menu items for restaurant ${restaurantId}: `, error);
      setMenuLoading(false);
    });

    const unsubscribeCategories = onSnapshot(collection(db, categoriesPath), (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(cats);
      setCategoriesLoading(false);
    }, (error) => {
      console.error(`Error fetching categories for restaurant ${restaurantId}: `, error);
      setCategoriesLoading(false);
    });

    const unsubscribeTables = onSnapshot(collection(db, tablesPath), (snapshot) => {
      const tbls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));
      setTables(tbls);
      setTablesLoading(false);
    }, (error) => {
      console.error(`Error fetching tables for restaurant ${restaurantId}: `, error);
      setTablesLoading(false);
    });

    return () => {
      unsubscribeMenuItems();
      unsubscribeCategories();
      unsubscribeTables();
    };
  }, [restaurantId]);

  const value = {
    menuItems,
    categories,
    tables,
    menuLoading,
    categoriesLoading,
    tablesLoading,
    restaurantId,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
