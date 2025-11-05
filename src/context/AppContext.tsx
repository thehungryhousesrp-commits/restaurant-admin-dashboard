
'use client';

import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { collection, onSnapshot, doc, query, where } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '@/lib/firebase';
import { type MenuItem, type Category, type Table, type AppUser, type Restaurant } from '@/lib/types';
import type { User as FirebaseUser } from 'firebase/auth';

interface AppContextType {
  user: FirebaseUser | null | undefined;
  appUser: AppUser | null;
  authLoading: boolean;
  appUserLoading: boolean;
  
  // Restaurant-related state
  restaurants: Restaurant[];
  activeRestaurant: Restaurant | null;
  restaurantId: string | null; // This is the active restaurant ID

  // Data for the active restaurant
  menuItems: MenuItem[];
  categories: Category[];
  tables: Table[];
  
  // Loading states for the data
  menuLoading: boolean;
  categoriesLoading: boolean;
  tablesLoading: boolean;
  restaurantsLoading: boolean;
}

export const AppContext = createContext<AppContextType>({
  user: undefined,
  appUser: null,
  authLoading: true,
  appUserLoading: true,
  
  restaurants: [],
  activeRestaurant: null,
  restaurantId: null,

  menuItems: [],
  categories: [],
  tables: [],

  menuLoading: true,
  categoriesLoading: true,
  tablesLoading: true,
  restaurantsLoading: true,
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, authLoading] = useAuthState(auth);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [appUserLoading, setAppUserLoading] = useState(true);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  
  const [menuLoading, setMenuLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [tablesLoading, setTablesLoading] = useState(true);

  // Derive active restaurant ID from the appUser state
  const restaurantId = appUser?.activeRestaurantId || null;

  // Derive the full active restaurant object
  const activeRestaurant = useMemo(() => {
    return restaurants.find(r => r.id === restaurantId) || null;
  }, [restaurants, restaurantId]);
  
  // Effect to fetch the custom user document from Firestore
  useEffect(() => {
    if (user) {
      setAppUserLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setAppUser({ uid: docSnap.id, ...docSnap.data() } as AppUser);
        } else {
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
      setAppUser(null);
      setAppUserLoading(false);
    }
  }, [user, authLoading]);

  // Effect to fetch the list of restaurants a user has access to
  useEffect(() => {
    if (appUser && appUser.restaurantIds && appUser.restaurantIds.length > 0) {
      setRestaurantsLoading(true);
      const restaurantsQuery = query(collection(db, 'restaurants'), where('__name__', 'in', appUser.restaurantIds));
      const unsubscribe = onSnapshot(restaurantsQuery, (querySnapshot) => {
        const userRestaurants = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
        setRestaurants(userRestaurants);
        setRestaurantsLoading(false);
      }, (error) => {
        console.error("Error fetching restaurants:", error);
        setRestaurants([]);
        setRestaurantsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setRestaurants([]);
      setRestaurantsLoading(false);
    }
  }, [appUser]);

  // Effect to fetch data for the currently active restaurant
  useEffect(() => {
    if (!restaurantId) {
      setMenuItems([]);
      setCategories([]);
      setTables([]);
      setMenuLoading(false);
      setCategoriesLoading(false);
      setTablesLoading(false);
      return;
    }

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
    restaurants,
    activeRestaurant,
    restaurantId,
    menuItems,
    categories,
    tables,
    menuLoading,
    categoriesLoading,
    tablesLoading,
    restaurantsLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
