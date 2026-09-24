import { env } from 'cloudflare:workers';
const base64url=(data:Uint8Array|string)=>btoa(typeof data==='string'?data:String.fromCharCode(...data)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const approved=(url:URL)=>url.protocol==='https:'&&['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].includes(url.hostname);
export function validEndpoint(endpoint:string){try{return endpoint.length<=2048&&approved(new URL(endpoint))}catch{return false}}
export async function sendPush(userId:string){
 if(!env.DB||!env.VAPID_PRIVATE_JWK||!env.VAPID_PUBLIC_KEY)return;
 const subscriptions=(await env.DB.prepare('SELECT endpoint FROM push_subscriptions WHERE user_id=? LIMIT 30').bind(userId).all<{endpoint:string}>()).results;
 if(!subscriptions.length)return;
 const jwk=JSON.parse(env.VAPID_PRIVATE_JWK) as JsonWebKey;
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 await Promise.allSettled(subscriptions.map(async row=>{
  try{
   const url=new URL(row.endpoint);if(!approved(url))return;
   const payload=base64url(JSON.stringify({aud:url.origin,exp:Math.floor(Date.now()/1000)+3600,sub:'mailto:pharaujo7@gmail.com'}));
   const header=base64url(JSON.stringify({typ:'JWT',alg:'ES256'}));
   const input=header+'.'+payload;
   const signature=new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,new TextEncoder().encode(input)));
   const jwt=input+'.'+base64url(signature);
   const response=await fetch(row.endpoint,{method:'POST',headers:{Authorization:`vapid t=${jwt}, k=${env.VAPID_PUBLIC_KEY}`,TTL:'60'},signal:AbortSignal.timeout(4000)});
   if([404,410].includes(response.status))await env.DB!.prepare('DELETE FROM push_subscriptions WHERE endpoint=?').bind(row.endpoint).run();
  }catch{/* A falha do provedor não desfaz a notificação registrada no aplicativo. */}
 }));
}
