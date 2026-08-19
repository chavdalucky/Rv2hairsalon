importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCiMvg9lvFlC86ZWb1EOLzeC46WnSXIBoo",
  authDomain: "gen-lang-client-0654370990.firebaseapp.com",
  projectId: "gen-lang-client-0654370990",
  storageBucket: "gen-lang-client-0654370990.firebasestorage.app",
  messagingSenderId: "800761419880",
  appId: "1:800761419880:web:48d67420b1933b9c2243dd"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
