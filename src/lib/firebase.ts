// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
export const firebaseConfig = {
  "projectId": "studio-5171737170-2a797",
  "appId": "1:10603963276:web:10bc23127c23e6f5ddeca9",
  "apiKey": "AIzaSyDkrj0LduXqUzBRL55naM0ujx7bM9DjQF8",
  "authDomain": "studio-5171737170-2a797.firebaseapp.com",
  "storageBucket": "studio-5171737170-2a797.appspot.com"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db)
    .catch((error) => {
      if (error.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        // ...
        console.warn('Firestore persistence failed: multiple tabs open.');
      } else if (error.code == 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
        // ...
        console.warn('Firestore persistence not available in this browser.');
      }
    });
}

export { app, auth, db, storage };
