import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// IMPORTANT: Replace with your actual service account key file path and project ID
const serviceAccount = require('../../../../../../../../../../.secure/service-account.json');
const projectId = 'hungry-house-hub'; // Replace with your Firebase project ID

initializeApp({ 
    credential: cert(serviceAccount),
    projectId
});

const db = getFirestore();

async function deleteAllFromCollection(collectionPath: string) {
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.limit(500).get();

  if (snapshot.empty) {
    console.log(`No documents found in ${collectionPath}. Nothing to delete.`);
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  console.log(`Deleted ${snapshot.size} documents from ${collectionPath}.`);

  // Recurse to delete the next batch
  if (snapshot.size > 0) {
    await deleteAllFromCollection(collectionPath);
  }
}

async function main() {
  console.log('Starting data deletion...');
  
  // Erase all menu items
  await deleteAllFromCollection('menu-items');
  
  // Erase all categories
  await deleteAllFromCollection('categories');

  console.log('-----------------------------------------');
  console.log('✅ All menu items and categories have been permanently erased.');
  console.log('-----------------------------------------');
}

main().catch(error => {
  console.error('An error occurred:', error);
  process.exit(1);
});
