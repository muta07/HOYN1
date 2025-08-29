// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

// Firebase yapılandırması (Firebase v7.20.0+ uyumlu)
const firebaseConfig = {
  apiKey: "AIzaSyDJN3wqeaNxmk9l1I3Lg3KD8r2G6ziMZxM",
  authDomain: "hoyn-demo.firebaseapp.com",
  databaseURL: "https://hoyn-demo-default-rtdb.firebaseio.com",
  projectId: "hoyn-demo",
  storageBucket: "hoyn-demo.firebasestorage.app",
  messagingSenderId: "818752786451",
  appId: "1:818752786451:web:d3dc938ad4ee898a9d6fe6",
  measurementId: "G-HQ6KYZZPQG"
};

// Firebase başlat
const app = initializeApp(firebaseConfig);

// Hizmetleri dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const database = getDatabase(app);