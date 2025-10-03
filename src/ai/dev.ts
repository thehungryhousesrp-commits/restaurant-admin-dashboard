
// Use this file for one-off development scripts.
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";
import { firebaseConfig } from "../lib/firebase"; // Assuming your config is exported from here

// IMPORTANT: RUN THIS SCRIPT FROM THE ROOT DIRECTORY
// npx tsx src/ai/dev.ts

async function addCategories() {
  // --- 1. Define Categories ---
  const newCategories = [
    { name: "Shakes" },
    { name: "Mocktails" },
    { name: "Dessert" },
    { name: "Pasta" },
    { name: "Continental Starter" },
    { name: "Chinese Starter" },
    { name: "Pizza" },
    { name: "Continental Platter" },
    { name: "Rice" },
    { name: "Noodles" },
    { name: "Gravy" },
  ];

  // --- 2. Initialize Firebase ---
  console.log("Initializing Firebase...");
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const categoriesCollection = collection(db, "categories");

  // --- 3. Fetch Existing Categories ---
  console.log("Fetching existing categories...");
  const snapshot = await getDocs(categoriesCollection);
  const existingCategoryNames = new Set(snapshot.docs.map(doc => doc.data().name.toLowerCase()));
  console.log(`Found ${existingCategoryNames.size} existing categories.`);

  // --- 4. Add New Categories ---
  console.log("Checking and adding new categories...");
  for (const category of newCategories) {
    if (existingCategoryNames.has(category.name.toLowerCase())) {
      console.log(`- Category \"${category.name}\" already exists. Skipping.`);
    } else {
      try {
        await addDoc(categoriesCollection, category);
        console.log(`+ Added category: \"${category.name}\"`);
      } catch (e) {
        console.error(`x Failed to add category \"${category.name}\":`, e);
      }
    }
  }
  console.log("\nCategory sync complete. You may need to kill this script manually (Ctrl+C).");
  // The script will hang because of the active firebase connection.
  // This is expected for this one-off script.
  process.exit(0);
}

addCategories();
