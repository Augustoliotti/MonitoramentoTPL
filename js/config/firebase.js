// Arquivo: js/config/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"; // Novo import

const firebaseConfig = {
  apiKey: "AIzaSyD9M4nTZjQcKPDNGNh4RJyBomQeOyGb0yM",
  authDomain: "monitoramentotpl-17aa3.firebaseapp.com",
  projectId: "monitoramentotpl-17aa3",
  storageBucket: "monitoramentotpl-17aa3.firebasestorage.app",
  messagingSenderId: "418904686486",
  appId: "1:418904686486:web:6e0a679546ef81887ae7b7",
  measurementId: "G-21QGLJV6MD"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // Exporta a autenticação