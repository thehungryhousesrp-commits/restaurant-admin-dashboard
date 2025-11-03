
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// IMPORTANT: Make sure the path to your service account key file is correct.
const serviceAccount = require('../../../../../../../.secure/service-account.json');
const projectId = 'hungry-house-hub'; // Replace with your Firebase project ID if it's different

initializeApp({ 
    credential: cert(serviceAccount),
    projectId
});

const db = getFirestore();

/**
 * Migrates all documents in the 'menu-items' collection to the new data structure.
 * - Ensures `isAvailable` and `isVeg` fields exist and are booleans.
 * - Removes old/unused fields.
 */
async function migrateMenuItems() {
  console.log("Starting menu item data migration...");
  const menuItemsRef = db.collection('menu-items');
  const snapshot = await menuItemsRef.get();

  if (snapshot.empty) {
    console.log("No menu items found to migrate.");
    return;
  }

  const batch = db.batch();
  let migratedCount = 0;

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    let needsUpdate = false;
    
    // This is the new, clean data structure we want.
    const updatedData: { [key: string]: any } = {
        name: data.name || "Unnamed Item",
        description: data.description || "",
        price: data.price || 0,
        category: data.category || "uncategorized",
        isAvailable: true, // Default to true if missing
        isVeg: false,      // Default to false (Non-Veg) if missing
    };

    // 1. Check and sanitize 'isAvailable'
    if (typeof data.isAvailable !== 'boolean') {
        updatedData.isAvailable = true; // Set default
        needsUpdate = true;
    } else {
        updatedData.isAvailable = data.isAvailable;
    }

    // 2. Check and sanitize 'isVeg'
    if (typeof data.isVeg !== 'boolean') {
        // A simple heuristic for old data: if name contains 'chicken' or 'wings', it's probably non-veg.
        if (data.name && (data.name.toLowerCase().includes('chicken') || data.name.toLowerCase().includes('wings'))) {
            updatedData.isVeg = false;
        } else {
            updatedData.isVeg = true; // Default to true for other old items
        }
        needsUpdate = true;
    } else {
        updatedData.isVeg = data.isVeg;
    }

    // 3. Check for old fields to remove
    const fieldsToDelete: { [key: string]: any } = {};
    const oldFields = ['isChefsSpecial', 'isSpicy', 'imageUrl', 'imageHint'];
    oldFields.forEach(field => {
        if (field in data) {
            fieldsToDelete[field] = FieldValue.delete();
            needsUpdate = true;
        }
    });

    // If an update is needed, add it to the batch.
    if (needsUpdate) {
        batch.update(doc.ref, { ...updatedData, ...fieldsToDelete });
        migratedCount++;
    }
  });

  if (migratedCount > 0) {
    await batch.commit();
    console.log(`Successfully migrated ${migratedCount} menu items.`);
  } else {
    console.log("All menu items are already up-to-date. No migration needed.");
  }
}


async function main() {
  try {
    console.log('Starting data migration process...');
    await migrateMenuItems();
    console.log('-----------------------------------------');
    console.log('✅ Data migration complete.');
    console.log('Your Firestore `menu-items` collection is now updated to the new structure.');
    console.log('-----------------------------------------');
  } catch(error) {
     console.error('An error occurred during data migration:', error);
     process.exit(1);
  }
}

main();
