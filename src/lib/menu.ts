import { addDoc, collection, deleteDoc, doc, writeBatch, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { type Category, type MenuItem } from "./types";

export const addCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
  const docRef = await addDoc(collection(db, "categories"), category);
  return { ...category, id: docRef.id };
};

export const addMenuItem = async (menuItem: Omit<MenuItem, 'id'>) => {
  await addDoc(collection(db, "menuItems"), menuItem);
};

export const deleteCategory = async (categoryId: string) => {
  await deleteDoc(doc(db, "categories", categoryId));
};

export const updateMenuItem = async (itemId: string, updates: Partial<MenuItem>) => {
    const itemRef = doc(db, "menuItems", itemId);
    await updateDoc(itemRef, updates);
};

export const deleteMenuItems = async (itemIds: string[]) => {
    const batch = writeBatch(db);
    itemIds.forEach(id => {
        const docRef = doc(db, "menuItems", id);
        batch.delete(docRef);
    });
    await batch.commit();
};
