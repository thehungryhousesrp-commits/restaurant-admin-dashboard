// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

export { app, auth, db };
