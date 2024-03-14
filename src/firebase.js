import { initializeApp } from 'firebase/app';

import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyAyDE-JZNr1GK1m2aZVMM3AIcB8et__tNw",
    authDomain: "flappy-bird-eced3.firebaseapp.com",
    projectId: "flappy-bird-eced3",
    storageBucket: "flappy-bird-eced3.appspot.com",
    messagingSenderId: "793123279017",
    appId: "1:793123279017:web:f8bd4469854b66556f99b8",
    measurementId: "G-LBMNKJ1TCN"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db }; 