// StackTracker Push Notification Service Worker
// This handles background push notifications even when the app is closed

// Cache name for the service worker
const CACHE_NAME = 'stacktracker-push-cache-v1';

// Listen for push events
self.addEventListener('push', function(event) {
  // Keep the service worker alive until the notification is created
  event.waitUntil(
    // Process the push notification data
    handlePushEvent(event)
  );
});

// Handle the push event data and show a notification
async function handlePushEvent(event) {
  let payload;
  
  // Parse data from the push event
  try {
    if (event.data) {
      payload = event.data.json();
    } else {
      payload = {
        title: 'StackTracker',
        message: 'New notification from StackTracker',
        tag: 'default',
        url: '/'
      };
    }
  } catch (err) {
    console.error('Error parsing push notification:', err);
    payload = {
      title: 'StackTracker',
      message: 'New notification',
      tag: 'default',
      url: '/'
    };
  }

  // Options for the notification
  const options = {
    body: payload.message || 'Check your supplement tracking data',
    icon: '/logo192.png', // Path to your notification icon
    badge: '/badge-icon.png', // Small icon for Android
    tag: payload.tag || 'default',
    data: {
      url: payload.url || '/'
    },
    requireInteraction: payload.requireInteraction || false,
  };
  
  // Add actions if available
  if (payload.actions && Array.isArray(payload.actions)) {
    options.actions = payload.actions;
  }

  // Show the notification
  return self.registration.showNotification(payload.title || 'StackTracker', options);
}

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  // Close the notification
  event.notification.close();
  
  // Handle action clicks (like "Give Feedback" or "Remind Later")
  if (event.action === 'feedback') {
    // Open the feedback page
    event.waitUntil(
      clients.openWindow('/supplement-history')
    );
  } else if (event.action === 'later') {
    // We'll handle this through the server if needed
    console.log('User requested reminder for later');
  } else {
    // Default behavior: open the URL from the notification data
    const urlToOpen = event.notification.data.url || '/';
    
    event.waitUntil(
      // Try to find existing window and focus it
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(windowClients => {
        // Check if there is already a window/tab open with the target URL
        const matchingClient = windowClients.find(
          windowClient => windowClient.url.includes(urlToOpen)
        );
        
        // If so, focus it
        if (matchingClient) {
          return matchingClient.focus();
        }
        
        // If not, open a new window/tab
        return clients.openWindow(urlToOpen);
      })
    );
  }
});

// Handle subscription change event
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('Subscription expired');
  event.waitUntil(
    // Re-subscribe and update the new subscription on the server
    self.registration.pushManager.subscribe({ userVisibleOnly: true })
      .then(function(subscription) {
        console.log('Subscribed after change', subscription.endpoint);
        // Post the new subscription to the server
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
              auth: arrayBufferToBase64(subscription.getKey('auth'))
            }
          }),
          credentials: 'include'
        });
      })
  );
});

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer) {
  if (!buffer) return '';
  
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Service worker install event - cache assets
self.addEventListener('install', event => {
  self.skipWaiting();
  console.log('Push notification service worker installed');
});

// Service worker activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('Push notification service worker activated');
      return self.clients.claim();
    })
  );
});