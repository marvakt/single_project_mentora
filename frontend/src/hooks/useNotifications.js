import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../config/firebase-config";
import { useDispatch } from "react-redux";
import { updateFcmToken } from "../store/slices/userProfileSlice";

export const useNotifications = () => {
    const dispatch = useDispatch();

    const requestPermission = async () => {
        console.log('Requesting notification permission...');
        try {
            const permission = await Notification.requestPermission();
            console.log('Notification permission status:', permission);

            if (permission === 'granted') {
                console.log('Getting FCM token...');
                const token = await getToken(messaging, {
                    vapidKey: 'BGGnS_FDJskr8bOeGvur50dr2ZF0KkwbT0-U6BYG_pryRYSihSc1Tf3hc9TYpFkKalxiMeurROPEJDRjyyeigpc'
                });

                if (token) {
                    console.log('FCM Token generated successfully:', token);
                    // Dispatch action to save token to backend
                    dispatch(updateFcmToken(token));
                } else {
                    console.warn('No FCM token generated. Check if Service Worker is registered and VAPID key is correct.');
                }
            } else {
                console.warn('Notification permission denied by user.');
            }
        } catch (error) {
            console.error('Error in FCM setup flow:', error);
        }
    };

    const listenForMessages = () => {
        onMessage(messaging, (payload) => {
            console.log('Message received in foreground: ', payload);

            // Manually trigger a system-level notification if permission is granted
            if (Notification.permission === 'granted') {
                const { title, body } = payload.notification;

                // Use service worker to show notification (standard for FCM)
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.ready.then((registration) => {
                        registration.showNotification(title, {
                            body,
                            icon: '/vite.svg', // You can replace this with your app logo
                            tag: 'fcm-foreground-alert'
                        });
                    });
                } else {
                    // Fallback for browsers without active service worker controller
                    new Notification(title, { body, icon: '/vite.svg' });
                }
            }
        });
    };

    return { requestPermission, listenForMessages };
};
