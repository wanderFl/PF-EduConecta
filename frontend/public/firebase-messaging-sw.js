importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Configuración idéntica a src/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyBXUItScwlB48lyBl_qTegq005nOrxPW_0",
  authDomain: "educonecta-2b823.firebaseapp.com",
  projectId: "educonecta-2b823",
  storageBucket: "educonecta-2b823.firebasestorage.app",
  messagingSenderId: "176082449458",
  appId: "1:176082449458:web:123fd90021bbc223ddb82b",
  measurementId: "G-WMKN648RGQ"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg' 
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});