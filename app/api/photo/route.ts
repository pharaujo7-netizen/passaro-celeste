import { env } from 'cloudflare:workers';
import { cookies, headers } from 'next/headers';
export const runtime='edge';
const digest=async(t:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)))).map(x=>x.toString(16).padStart(2,'0')).join('');
async function identity(){
 if((await headers()).get('oai-authenticated-user-email')?.toLowerCase()==='pharaujo7@gmail.com')return{id:'creator',role:'creator'};
 const token=(await cookies()).get('pc_session')?.value;if(!token||!env.DB)return null;
 return env.DB.prepare('SELECT u.id,u.role FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>? AND u.status=?').bind(await digest(token),Date.now(),'active').first<{id:string;role:string}>();
}
export async function POST(req:Request){
 const p=await identity();if(!p||!env.DB||!env.BUCKET)return new Response('Acesso negado',{status:403});
 const form=await req.formData(),kind=String(form.get('kind')),id=String(form.get('id')),file=form.get('file');
 if(!['user','unit'].includes(kind)||!id||!(file instanceof File)||file.size>5*1024*1024||file.size===0||!['image/jpeg','image/png','image/webp'].includes(file.type))return new Response('Envie imagem JPG, PNG ou WebP até 5 MB.',{status:400});
 const data=new Uint8Array(await file.arrayBuffer()),hex=Array.from(data.slice(0,12)).map(x=>x.toString(16).padStart(2,'0')).join('');
 if(!(file.type==='image/jpeg'&&hex.startsWith('ffd8ff')||file.type==='image/png'&&hex.startsWith('89504e470d0a1a0a')||file.type==='image/webp'&&hex.startsWith('52494646')&&new TextDecoder().decode(data.slice(8,12))==='WEBP'))return new Response('Imagem inválida.',{status:400});
 const managers=['creator','director','secretary'].includes(p.role);
 const guardian=kind==='user'&&p.role==='guardian'&&Boolean(await env.DB.prepare('SELECT id FROM guardianships WHERE guardian_id=? AND pathfinder_id=? AND may_access=1').bind(p.id,id).first());
 if(kind==='unit'&&!managers||kind==='user'&&!managers&&p.id!==id&&!guardian)return new Response('Sem permissão.',{status:403});
 const table=kind==='unit'?'units':'users';const old=await env.DB.prepare(`SELECT photo_key FROM ${table} WHERE id=?`).bind(id).first<{photo_key:string|null}>();if(!old)return new Response('Cadastro não encontrado',{status:404});
 const key=`photos/${kind}/${id}/${crypto.randomUUID()}`;
 await env.BUCKET.put(key,data,{httpMetadata:{contentType:file.type}});
 try{await env.DB.prepare(`UPDATE ${table} SET photo_key=? WHERE id=?`).bind(key,id).run()}catch{await env.BUCKET.delete(key);return new Response('Falha ao salvar imagem',{status:500})}
 if(old.photo_key)await env.BUCKET.delete(old.photo_key);
 return Response.json({ok:true});
}
export async function GET(req:Request){
 const p=await identity();if(!p||!env.DB||!env.BUCKET)return new Response('Acesso negado',{status:403});
 const u=new URL(req.url),kind=u.searchParams.get('kind'),id=u.searchParams.get('id');if(!id||!['user','unit'].includes(kind||''))return new Response('Imagem inválida',{status:400});
 const row=await env.DB.prepare(`SELECT photo_key FROM ${kind==='unit'?'units':'users'} WHERE id=?`).bind(id).first<{photo_key:string|null}>();if(!row?.photo_key)return new Response('Imagem não encontrada',{status:404});
 const obj=await env.BUCKET.get(row.photo_key);if(!obj)return new Response('Imagem não encontrada',{status:404});
 return new Response(obj.body,{headers:{'Content-Type':obj.httpMetadata?.contentType||'application/octet-stream','Cache-Control':'private, max-age=300','X-Content-Type-Options':'nosniff'}});
}
