import { env } from 'cloudflare:workers';
import { cookies, headers } from 'next/headers';
export const runtime = 'edge';
const digest = async (token:string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,'0')).join('');
async function identity() {
 const h=await headers();
 if(h.get('oai-authenticated-user-email')?.toLowerCase()==='pharaujo7@gmail.com')return {id:'creator',role:'creator'};
 const token=(await cookies()).get('pc_session')?.value;
 if(!token||!env.DB)return null;
 return env.DB.prepare('SELECT u.id,u.role FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>? AND u.status=?').bind(await digest(token),Date.now(),'active').first<{id:string;role:string}>();
}
export async function POST(request:Request){
 const p=await identity();if(!p||!env.DB||!env.BUCKET)return new Response('Acesso indisponível',{status:403});
 const form=await request.formData();const submissionId=String(form.get('submissionId')||'');const file=form.get('file');
 if(!(file instanceof File)||!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type)||file.size>8*1024*1024||file.size===0)return new Response('Arquivo inválido (JPG, PNG, WebP ou PDF até 8 MB).',{status:400});
 const sub=await env.DB.prepare('SELECT s.id FROM submissions s JOIN enrollments e ON e.id=s.enrollment_id WHERE s.id=? AND e.user_id=?').bind(submissionId,p.id).first();
 if(!sub)return new Response('Atividade não encontrada',{status:403});
 const id=crypto.randomUUID();const key=`evidence/${submissionId}/${id}`;
 await env.BUCKET.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type}});
 try{await env.DB.prepare('INSERT INTO evidence_files (id,submission_id,object_key,file_name,content_type,size_bytes,created_at) VALUES (?,?,?,?,?,?,?)').bind(id,submissionId,key,file.name.slice(0,200),file.type,file.size,Date.now()).run();}
 catch {await env.BUCKET.delete(key);return new Response('Falha ao registrar arquivo',{status:500});}
 return Response.json({ok:true,id});
}
export async function GET(request:Request){
 const p=await identity();if(!p||!env.DB||!env.BUCKET)return new Response('Acesso negado',{status:403});
 const id=new URL(request.url).searchParams.get('id');if(!id)return new Response('Arquivo inválido',{status:400});
 const file=await env.DB.prepare('SELECT f.object_key,f.content_type,f.file_name,e.user_id FROM evidence_files f JOIN submissions s ON s.id=f.submission_id JOIN enrollments e ON e.id=s.enrollment_id WHERE f.id=?').bind(id).first<{object_key:string;content_type:string;file_name:string;user_id:string}>();
 if(!file)return new Response('Arquivo não encontrado',{status:404});
 const guardian=p.role==='guardian'&&Boolean(await env.DB.prepare('SELECT id FROM guardianships WHERE guardian_id=? AND pathfinder_id=? AND may_access=1').bind(p.id,file.user_id).first());
 if(file.user_id!==p.id&&!guardian&&!['creator','director','secretary','instructor'].includes(p.role))return new Response('Acesso negado',{status:403});
 const object=await env.BUCKET.get(file.object_key);if(!object)return new Response('Arquivo indisponível',{status:404});
 return new Response(object.body,{headers:{'Content-Type':file.content_type,'Content-Disposition':`attachment; filename="${file.file_name.replace(/["\\\r\n]/g,'_')}"`,'Cache-Control':'private, no-store'}});
}
