/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { ExpirationPlugin, NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const appPageCache = new NetworkFirst({
  cacheName: "year-mission-pages-v1",
  networkTimeoutSeconds: 3,
  plugins: [
    new ExpirationPlugin({
      maxEntries: 24,
      maxAgeSeconds: 7 * 24 * 60 * 60,
    }),
  ],
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher({ request, sameOrigin }) {
        return sameOrigin && request.mode === "navigate";
      },
      handler: appPageCache,
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

self.addEventListener("push", (event) => {
  const hour = new Date().getHours();
  const morning = hour < 14;
  event.waitUntil(
    self.registration.showNotification(morning ? "Year Mission · Morning" : "Year Mission · Evening", {
      body: morning
        ? "One-minute check-in: open Year Mission and see your next move."
        : "Two-minute closeout: close the loop, then leave the day behind.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: morning ? "year-mission-morning" : "year-mission-evening",
      data: { url: "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate("/");
          return;
        }
      }
      await self.clients.openWindow("/");
    })
  );
});

serwist.addEventListeners();
