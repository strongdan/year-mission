import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string }> }
) {
  const { path } = await params;
  if (path === "sw.js.map") {
    return new NextResponse("{}", {
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const { createSerwistRoute } = await import("@serwist/turbopack");
    const route = createSerwistRoute({
      additionalPrecacheEntries: [
        {
          url: "/~offline",
          revision: process.env.YEAR_MISSION_BUILD_SHA ?? "v1",
        },
      ],
      swSrc: "src/app/sw.ts",
      useNativeEsbuild: true,
    });
    return await route.GET(request, { params: Promise.resolve({ path }) });
  } catch {
    const swScript = `// Year Mission PWA Service Worker
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/~offline"))
    );
  }
});
`;

    return new NextResponse(swScript, {
      headers: {
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "public, max-age=0, must-revalidate",
      },
    });
  }
}