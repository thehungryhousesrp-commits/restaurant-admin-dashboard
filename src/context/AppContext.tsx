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

// Hardcoded fallback data URI
const fallbackLogoDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAO4AAADUCAMAAABs03X/AAAAkFBMVEX////AAD/pKT/ycnJycl/f3//uLj/tLT/LS3/GBj/ERH/+/v/jIz/wcH/8PD/ubn/1dX/4uL/6+v/aWn/DAz/MDD/rq7/oKD/d3f/U1P/RUX/h4f/fn7/iIj/goL/lJT/w8P/yMj/t7f/3t7/6ur/9PT/Kir/WFj/Z2f/c3P/fX3/n5//qan/z8//2dn/5ub/7u7/+vr/ICD/Pz8018KZAAAIq0lEQVR4nO2d63qiMBCGSyEQBERA8YKKvVbr/V/sVbfeT6wBiSEkh+xz/s5nJvPgzZtLCElMa9rSkpY2sYc97GEP+9jDHvawe8P0Ea+F/wO8b+u1f/uV9++sA3s4g//4f8xf+f+v3/j9+v5+AAiA+i+/8fv+n+f5H8/y/4w/8//1/X0BCICK71/5/s8z/v85z/8y/8f8X9/fH4AAYO39K9/f/1n/d/7P/zD/x/xf398fgACg8P4V8M8G//9/nv9h/o/5v76/PwABwML7V74f/3n+j/k/5v/6/v4ABAQ771/5/s8z/v85z/8y/8f8X9/fH4AA4EH7V74f/3n+j/k/5v/6/v4ABAQr71/5/s8z/v85z/8y/8f8X9/fH4AAYEv7V74f/3n+j/k/5v/6/v4ABARb3r/y/Z9n/P9znv9l/o/5v76/PwABwD/tX/n+zzP+/znP/zL/x/xf398fgAAgKfuXvn+z3P+vznP/zL/x/xf398fgACAV+5e+X7/5/k/5v+Y/+v7+wMQAPy2e+X7P8/4/uc8/8v8H/N/fX9/AAKA37V75fs/z/j+5zz/y/wf8399f38AAoC/7V75fs/zf57n/5h/Y/6v7+8PQADwH7tXvr/zDP+/znP/zL/x/xf398fgADg0f1e+f7PM/7/Oc//Mv/H/F/f3x+AAGDx/VfBvxt8/+c5/8v8H/N/fX9/AAKA1fdfeP8f8399f38AAsC1+1e+//MM/7/Oc//Mv/H/F/f3x+AAOD6/VfBvxt8/+c5/8v8H/N/fX9/AAKAq/df+P7PM/7/Oc//Mv/H/F/f3x+AAODm/VfBvxt8/+c5/8v8H/N/fX9/AAKA+/df+P7PM/7/Oc//Mv/H/F/f3x+AAODw/VfBvxt8/+c5/8v8H/N/fX9/AAKA0/df+P7PM/7/Oc//Mv/H/F/f3x+AAGDu/VfBvxt8/+c5/8v8H/N/fX9/AAKA9/df+P7PM/7/Oc//Mv/H/F/f3x+AAOD//VfBvxt8/+c5/8v8H/N/fX9/AAKAV+/+4/v7AxAAvHr3j+/vD0AA8OrdP76/PwABwKt3//j+/gAEAO9+/+f5P8/zP8zzP8z/M//H/F/f3x+AAODdW99/Yv6v7+8PQADw7tZ335i/6/v7AxAA3Lu13Tem/Pr+8gAEAG/e+u5b0359f/kABACv3/juG9N+fX/5AAQA79747lvTfn1/+QAEAG/c+u5b0359f/kABAAv3/juG9N+fX/5AAQAb9z67lvTfn1/+QAEAC/e+u5b0359f/kABAC33/juW9N+fX/5AAQAb9z67lvTfn1/+QAEAC/d+u5b0359f/kABAC33PjuW9N+fX/5AAQAr9z67lvTfn1/+QAEAK/d+u5b0359f/kABACv3/ruW9N+fX/1AAQAr9v67lvTfn1/+QAEAO/c+u5b0359f/kABACv3/juW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/1AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/1AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/eQAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/1AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/1AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/1AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+uJACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/1AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1G/D6/vIABIDe+u5b0/5+ff94AAJA7r1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+";

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

        // Fetch Logo
        const qLogo = query(collection(db, "Brand Asset"));
        const unsubscribeLogo = onSnapshot(qLogo, (snapshot) => {
            if (!snapshot.empty) {
                // Assuming there's only one document in the 'Brand Asset' collection
                const logoDoc = snapshot.docs[0];
                const data = logoDoc.data();
                if (data.logoDataUri && data.logoDataUri !== 'placeholder') {
                    setLogoDataUri(data.logoDataUri);
                }
            }
        }, (err) => {
            console.error("Error fetching logo: ", err);
            // Fallback to hardcoded URI if there's an error
            setLogoDataUri(fallbackLogoDataUri);
        });


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
            unsubscribeLogo();
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
