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

interface NotificationContextResponse {
  ok: boolean;
  movement?: {
    daysSinceAny: number | null;
    recommendation: string;
    options: string[];
  } | null;
}

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

function localDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function movementNotificationContext(): Promise<NotificationContextResponse["movement"]> {
  try {
    const response = await fetch(`/api/notifications/context?date=${localDateString()}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) return null;
    const context = (await response.json()) as NotificationContextResponse;
    return context.movement ?? null;
  } catch {
    return null;
  }
}

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    const hour = new Date().getHours();
    const morning = hour < 14;
    const movement = await movementNotificationContext();

    let title = morning ? "Year Mission · Morning" : "Year Mission · Evening";
    let body = morning
      ? "One-minute check-in: open Year Mission and see your next move."
      : "Two-minute closeout: close the loop, then leave the day behind.";
    let tag = morning ? "year-mission-morning" : "year-mission-evening";

    if (movement) {
      const quiet = movement.daysSinceAny === null
        ? "It’s been a while since you logged a movement outing."
        : `It’s been ${movement.daysSinceAny} days since you logged a movement outing.`;
      const choices = movement.options.join(", ");
      title = "Year Mission · Pick something fun";
      body = `${quiet} How about ${movement.recommendation}? ${choices}.`;
      tag = "year-mission-movement";
    }

    await self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag,
      data: { url: "/" },
    });
  })());
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
