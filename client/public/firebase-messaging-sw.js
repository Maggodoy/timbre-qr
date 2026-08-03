importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDvPb_JtFdosXf6x37qBZ0aSVdPxV9Cpd4",
  authDomain: "timbre-qr-a9683.firebaseapp.com",
  projectId: "timbre-qr-a9683",
  storageBucket: "timbre-qr-a9683.firebasestorage.app",
  messagingSenderId: "480042410539",
  appId: "1:480042410539:web:f459d69ed60c69e494406e",
  measurementId: "G-QQWLY4GM3K"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Notificación recibida en segundo plano ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});