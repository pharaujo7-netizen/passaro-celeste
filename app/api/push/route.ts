import { env } from 'cloudflare:workers';
export const runtime='edge';
export async function GET(){return Response.json({publicKey:env.VAPID_PUBLIC_KEY||null},{headers:{'Cache-Control':'public, max-age=3600'}})}
