const CACHE = 'passaro-celeste-shell-v2';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(['/offline.html','/icon-192.png','/icon-512.png'])));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/offline.html')));
  }
});
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let title = 'Pássaro Celeste', body = 'Você tem um novo aviso no clube.';
    try {
      const response = await fetch('/api/app', {credentials:'include',cache:'no-store'});
      if(response.ok){const data=await response.json();const latest=data.notifications?.find(item=>!item.read_at);if(latest){title=latest.title;body=latest.body}}
    } catch {}
    await self.registration.showNotification(title,{body,icon:'/icon-192.png',badge:'/icon-192.png',tag:'passaro-celeste-atividade',data:{url:'/'}});
  })());
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url||'/'));
});
