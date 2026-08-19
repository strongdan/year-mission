// src/edge/hello.ts
export const runtime = 'edge';

export async function GET(request: Request) {
  return new Response('Hello from the Year Mission edge function!', {
    status: 200,
    headers: { 'content-type': 'text/plain' },
  });
}
