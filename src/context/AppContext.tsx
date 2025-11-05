
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '@/lib/firebase';
import { type MenuItem, type Category, type Table, type AppUser } from '@/lib/types';
import type { User as FirebaseUser } from 'firebase/auth';

interface AppContextType {
  user: FirebaseUser | null | undefined;
  appUser: AppUser | null;
  authLoading: boolean;
  appUserLoading: boolean;
  restaurantId: string | null;
  menuItems: MenuItem[];
  categories: Category[];
  tables: Table[];
  menuLoading: boolean;
  categoriesLoading: boolean;
  tablesLoading: boolean;
}

export const AppContext = createContext<AppContextType>({
  user: undefined,
  appUser: null,
  authLoading: true,
  appUserLoading: true,
  restaurantId: null,
  menuItems: [],
  categories: [],
  tables: [],
  menuLoading: true,
  categoriesLoading: true,
  tablesLoading: true,
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, authLoading] = useAuthState(auth);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [appUserLoading, setAppUserLoading] = useState(true);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [tablesLoading, setTablesLoading] = useState(true);

  const restaurantId = appUser?.activeRestaurantId || (appUser?.restaurantIds && appUser.restaurantIds[0]) || null;
  
  // Effect to fetch the custom user document from Firestore
  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setAppUser({ uid: docSnap.id, ...docSnap.data() } as AppUser);
        } else {
          // This case might happen if user record in auth exists but not in firestore.
          // Should be handled by your sign-up logic.
          setAppUser(null);
        }
        setAppUserLoading(false);
      }, (error) => {
        console.error("Error fetching app user:", error);
        setAppUser(null);
        setAppUserLoading(false);
      });
      return () => unsubscribe();
    } else if (!authLoading) {
      // User is not logged in
      setAppUser(null);
      setAppUserLoading(false);
    }
  }, [user, authLoading]);


  // Effect to fetch restaurant-specific data
  useEffect(() => {
    if (!restaurantId) {
      // If there's no restaurant ID, reset data and stop loading states
      setMenuItems([]);
      setCategories([]);
      setTables([]);
      setMenuLoading(false);
      setCategoriesLoading(false);
      setTablesLoading(false);
      return;
    };

    setMenuLoading(true);
    setCategoriesLoading(true);
    setTablesLoading(true);

    const menuItemsPath = `restaurants/${restaurantId}/menu-items`;
    const categoriesPath = `restaurants/${restaurantId}/categories`;
    const tablesPath = `restaurants/${restaurantId}/tables`;

    const unsubscribeMenuItems = onSnapshot(collection(db, menuItemsPath), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      setMenuItems(items);
      setMenuLoading(false);
    });

    const unsubscribeCategories = onSnapshot(collection(db, categoriesPath), (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(cats);
      setCategoriesLoading(false);
    });

    const unsubscribeTables = onSnapshot(collection(db, tablesPath), (snapshot) => {
      const tbls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));
      setTables(tbls);
      setTablesLoading(false);
    });

    return () => {
      unsubscribeMenuItems();
      unsubscribeCategories();
      unsubscribeTables();
    };
  }, [restaurantId]);

  const value = {
    user,
    appUser,
    authLoading,
    appUserLoading,
    restaurantId,
    menuItems,
    categories,
    tables,
    menuLoading,
    categoriesLoading,
    tablesLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
