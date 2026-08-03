import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Configuración obtenida de la consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDvPb_JtFdosXf6x37qBZ0aSVdPxV9Cpd4",
  authDomain: "timbre-qr-a9683.firebaseapp.com",
  projectId: "timbre-qr-a9683",
  storageBucket: "timbre-qr-a9683.firebasestorage.app",
  messagingSenderId: "480042410539",
  appId: "1:480042410539:web:f459d69ed60c69e494406e",
  measurementId: "G-QQWLY4GM3K"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar el servicio de notificaciones Push
let messaging = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  messaging = getMessaging(app);
}

export { app, messaging, getToken, onMessage };