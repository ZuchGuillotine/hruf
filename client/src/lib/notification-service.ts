/**
 * Service for handling browser push notification subscriptions
 * and permission requests
 */

// Function to convert ArrayBuffer to base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Check if push notifications are supported by the browser
export const isPushNotificationSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Ask for notification permission
export const askNotificationPermission = async (): Promise<boolean> => {
  if (!isPushNotificationSupported()) {
    console.log('Push notifications not supported');
    return false;
  }

  try {
    const permissionResult = await Notification.requestPermission();
    return permissionResult === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Get current notification permission status
export const getNotificationPermissionStatus = (): NotificationPermission => {
  return Notification.permission;
};

// Register the service worker for push notifications
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isPushNotificationSupported()) {
    return null;
  }

  try {
    return await navigator.serviceWorker.register('/service-worker.js');
  } catch (error) {
    console.error('Error registering service worker:', error);
    return null;
  }
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async (): Promise<PushSubscription | null> => {
  if (!isPushNotificationSupported()) {
    return null;
  }

  try {
    // Register service worker if not already registered
    let serviceWorkerRegistration = await navigator.serviceWorker.ready;
    if (!serviceWorkerRegistration) {
      serviceWorkerRegistration = await registerServiceWorker();
      if (!serviceWorkerRegistration) {
        return null;
      }
    }

    // Get the server's public key for VAPID
    const response = await fetch('/api/push/vapid-public-key');
    if (!response.ok) {
      console.error('Failed to get public key');
      return null;
    }

    const { publicKey } = await response.json();

    // Unsubscribe from any existing subscription
    const existingSubscription = await serviceWorkerRegistration.pushManager.getSubscription();
    if (existingSubscription) {
      await existingSubscription.unsubscribe();
    }

    // Create a new subscription
    const subscription = await serviceWorkerRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey
    });

    // Send the subscription to the server
    await sendSubscriptionToServer(subscription);

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const serviceWorkerRegistration = await navigator.serviceWorker.ready;
    const subscription = await serviceWorkerRegistration.pushManager.getSubscription();

    if (subscription) {
      // Send unsubscribe request to server first
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        }),
        credentials: 'include'
      });

      // Then unsubscribe locally
      const result = await subscription.unsubscribe();
      return result;
    }

    return true; // Already unsubscribed
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
};

// Send the push subscription to the server
export const sendSubscriptionToServer = async (subscription: PushSubscription): Promise<boolean> => {
  try {
    const keys = subscription.getKey ? {
      p256dh: subscription.getKey('p256dh') ? arrayBufferToBase64(subscription.getKey('p256dh')!) : '',
      auth: subscription.getKey('auth') ? arrayBufferToBase64(subscription.getKey('auth')!) : ''
    } : undefined;

    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys
      }),
      credentials: 'include'
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending subscription to server:', error);
    return false;
  }
};

// Check if user has an active subscription
export const checkExistingSubscription = async (): Promise<PushSubscription | null> => {
  if (!isPushNotificationSupported()) {
    return null;
  }

  try {
    const serviceWorkerRegistration = await navigator.serviceWorker.ready;
    return await serviceWorkerRegistration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error checking existing subscription:', error);
    return null;
  }
};

// Update user notification settings on the server
export const updateNotificationSettings = async (enabled: boolean): Promise<boolean> => {
  try {
    const response = await fetch('/api/notifications/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        enabled
      }),
      credentials: 'include'
    });

    return response.ok;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return false;
  }
};