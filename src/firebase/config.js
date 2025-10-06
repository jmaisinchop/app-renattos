// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 

/*const firebaseConfig = {

  authDomain: "renattos-prod.firebaseapp.com",
  projectId: "renattos-prod",
  storageBucket: "renattos-prod.firebasestorage.app",
  messagingSenderId: "931660024927",
  appId: "1:931660024927:web:9eee07ce8e015e523fdfea",
  measurementId: "G-05X1CP3CJK"
};*/

const firebaseConfig = {

  authDomain: "renattos-almacenes.firebaseapp.com",
  projectId: "renattos-almacenes",
  storageBucket: "renattos-almacenes.firebasestorage.app",
  messagingSenderId: "598742613630",
  appId: "1:598742613630:web:32dcf1c9fbd1b34ae3222f",
  measurementId: "G-LHG7VJHCZD"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

export { app };
