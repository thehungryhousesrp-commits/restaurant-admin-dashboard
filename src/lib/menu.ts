
import { addDoc, collection, deleteDoc, doc, writeBatch, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { type Category, type MenuItem } from "./types";

export const addCategory = async (restaurantId: string, category: Omit<Category, 'id' | 'restaurantId'>): Promise<Category> => {
  const categoriesColRef = collection(db, `restaurants/${restaurantId}/categories`);
  const payload = { ...category, restaurantId };
  const docRef = await addDoc(categoriesColRef, payload);
  return { ...payload, id: docRef.id };
};

export const addMenuItem = async (restaurantId: string, menuItem: Omit<MenuItem, 'id' | 'restaurantId'>) => {
  const menuItemsColRef = collection(db, `restaurants/${restaurantId}/menu-items`);
  const payload = { ...menuItem, restaurantId };
  await addDoc(menuItemsColRef, payload);
};

export const deleteCategory = async (restaurantId: string, categoryId: string) => {
  const categoryDocRef = doc(db, `restaurants/${restaurantId}/categories`, categoryId);
  await deleteDoc(categoryDocRef);
};

export const updateMenuItem = async (restaurantId: string, itemId: string, updates: Partial<Omit<MenuItem, 'id' | 'restaurantId'>>) => {
    const itemRef = doc(db, `restaurants/${restaurantId}/menu-items`, itemId);
    await updateDoc(itemRef, updates);
};

export const deleteMenuItems = async (restaurantId: string, itemIds: string[]) => {
    if (itemIds.length === 0) return;
    const batch = writeBatch(db);
    itemIds.forEach(id => {
        const docRef = doc(db, `restaurants/${restaurantId}/menu-items`, id);
        batch.delete(docRef);
    });
    await batch.commit();
};
