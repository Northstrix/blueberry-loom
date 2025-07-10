"use client"
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "database-name-default-rtdb.firebaseapp.com",
  projectId: "database-name-default-rtdb",
  storageBucket: "databaseforblueberryloom.appspot.com",
  messagingSenderId: "111111111111",
  appId: "1:111111111111:web:abcdefghjklmnopqrstuvw"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)