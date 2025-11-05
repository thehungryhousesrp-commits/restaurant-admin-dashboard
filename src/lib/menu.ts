
import { addDoc, collection, deleteDoc, doc, writeBatch, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { type Category, type MenuItem } from "./types";

// NOTE: All functions now require a restaurantId to target the correct sub-collection.

export const addCategory = async (restaurantId: string, category: Omit<Category, 'id'>): Promise<Category> => {
  const categoriesColRef = collection(db, `restaurants/${restaurantId}/categories`);
  const docRef = await addDoc(categoriesColRef, category);
  return { ...category, id: docRef.id };
};

export const addMenuItem = async (restaurantId: string, menuItem: Omit<MenuItem, 'id'>) => {
  const menuItemsColRef = collection(db, `restaurants/${restaurantId}/menu-items`);
  // Ensure the menuItem object includes the restaurantId
  await addDoc(menuItemsColRef, { ...menuItem, restaurantId });
};

export const deleteCategory = async (restaurantId: string, categoryId: string) => {
  const categoryDocRef = doc(db, `restaurants/${restaurantId}/categories`, categoryId);
  await deleteDoc(categoryDocRef);
};

export const updateMenuItem = async (restaurantId: string, itemId: string, updates: Partial<MenuItem>) => {
    const itemRef = doc(db, `restaurants/${restaurantId}/menu-items`, itemId);
    await updateDoc(itemRef, updates);
};

export const deleteMenuItems = async (restaurantId: string, itemIds: string[]) => {
    const batch = writeBatch(db);
    itemIds.forEach(id => {
        const docRef = doc(db, `restaurants/${restaurantId}/menu-items`, id);
        batch.delete(docRef);
    });
    await batch.commit();
};
