self.addEventListener("install", event => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("push", event => {
  const message = event.data?.json();
  if (!message) return;
  event.waitUntil(self.registration.showNotification("АЛИРА · Поверка", {
    body:message.body,
    icon:"/cabinet-preview/icon-192.png",
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil((async () => {
    const url = new URL("./index.html#schedule", self.location.href).href;
    const windows = await self.clients.matchAll({type:"window",includeUncontrolled:true});
    const cabinet = windows.find(client => client.url.startsWith(new URL("./",self.location.href).href));
    if (cabinet) {
      await cabinet.navigate(url);
      await cabinet.focus();
    } else await self.clients.openWindow(url);
  })());
});
