self.addEventListener('install', (event) => {
  console.log('[EquiMaster SW] installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[EquiMaster SW] activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[EquiMaster SW] push event received');

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('[EquiMaster SW] push payload JSON parse failed', error);
  }

  const title = data.title || 'EquiMaster Pro';
  const options = {
    body: data.body || 'You have a new reminder.',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    data: { url: data.url || '/account' },
    tag: data.tag || 'equimaster-reminder',
    renotify: true,
  };

  console.log('[EquiMaster SW] showing notification', { title, options });

  event.waitUntil(
    self.registration.showNotification(title, options).catch((error) => {
      console.error('[EquiMaster SW] showNotification failed', error);
      throw error;
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[EquiMaster SW] notification clicked');
  event.notification.close();
  const target = event.notification.data?.url || '/account';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const existing = list.find((client) => 'focus' in client);
    if (existing) {
      existing.navigate(target);
      return existing.focus();
    }
    return clients.openWindow(target);
  }));
});
