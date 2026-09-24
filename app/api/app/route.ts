import { env } from 'cloudflare:workers';
import { cookies, headers } from 'next/headers';
import { sendPush, validEndpoint } from '@/lib/push';

export const runtime = 'edge';
const ownerEmail = 'pharaujo7@gmail.com';
const cookieName = 'pc_session';
const encoder = new TextEncoder();
type Person = { id: string; full_name: string; phone: string; birth_date: string | null; gender: string | null; role: string; status: string };
const db = () => { if (!env.DB) throw new Error('Banco indisponível'); return env.DB; };
const query = async <T>(sql: string, ...args: unknown[]) => (await db().prepare(sql).bind(...args).all<T>()).results;
const first = async <T>(sql: string, ...args: unknown[]) => db().prepare(sql).bind(...args).first<T>();
const run = async (sql: string, ...args: unknown[]) => db().prepare(sql).bind(...args).run();
const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))).map(x => x.toString(16).padStart(2, '0')).join('');
const random = () => crypto.randomUUID() + crypto.randomUUID();
const passwordHash = async (password: string, salt: string) => {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return Array.from(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:210000,hash:'SHA-256'},key,256))).map(x=>x.toString(16).padStart(2,'0')).join('');
};
const fail = (message: string, status = 400) => Response.json({ error: message }, {status});
const stamp = () => Date.now();
const cleanPhone = (s: string) => {const digits=s.replace(/\D/g,'');return digits.length===13&&digits.startsWith('55')?digits.slice(2):digits};
const localStart = (value: unknown) => Date.parse(String(value||'') + '-03:00');
const ageYears = (birth: string) => {const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());const [y,m,d]=today.split('-').map(Number),[by,bm,bd]=birth.split('-').map(Number);return y-by-(m<bm||m===bm&&d<bd?1:0)};
const staff = (p: Person) => ['creator','director','secretary','instructor'].includes(p.role);
const director = (p: Person) => ['creator','director','secretary'].includes(p.role);
const current = async (): Promise<Person | null> => {
  const h = await headers();
  const email = h.get('oai-authenticated-user-email')?.toLowerCase();
  if (email === ownerEmail) {
    const existing = await first<Person>('SELECT * FROM users WHERE id = ?', 'creator');
    if (!existing) await run('INSERT INTO users (id,full_name,phone,role,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?)','creator','Paulo Araújo','owner','creator','active',stamp(),stamp());
    return (await first<Person>('SELECT * FROM users WHERE id = ?', 'creator'))!;
  }
  const raw = (await cookies()).get(cookieName)?.value;
  if (!raw) return null;
  const person = await first<Person>('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.status=?',await hash(raw),stamp(),'active');
  return person ?? null;
};
const session = async (userId: string) => {
  const token = random();
  await run('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)',await hash(token),userId,stamp()+30*86400000);
  (await cookies()).set(cookieName,token,{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:30*86400});
};
const audit = (p: Person, action: string, kind: string, id: string) => run('INSERT INTO audit_log (id,actor_id,action,entity_type,entity_id,created_at) VALUES (?,?,?,?,?,?)',crypto.randomUUID(),p.id,action,kind,id,stamp());

export async function GET() {
 try {
  const p = await current();
  if (!p) return Response.json({authenticated:false});
  const events = await query('SELECT * FROM events WHERE starts_at>? ORDER BY starts_at LIMIT 100',stamp()-86400000);
  const units = await query('SELECT * FROM units ORDER BY name');
  const catalog = await query('SELECT * FROM catalog_items WHERE active=1 ORDER BY kind,name');
  const people = director(p) ? await query<Person>('SELECT id,full_name,phone,birth_date,gender,role,status,photo_key FROM users WHERE status<>? ORDER BY full_name','archived') : staff(p) ? await query<Person>('SELECT id,full_name,birth_date,gender,role,status,photo_key FROM users WHERE status<>? ORDER BY full_name','archived') : [];
  const visibleIds = p.role === 'guardian' ? (await query<{pathfinder_id:string}>('SELECT pathfinder_id FROM guardianships WHERE guardian_id=? AND may_access=1',p.id)).map(x=>x.pathfinder_id) : [p.id];
  const dependents = p.role==='guardian' ? await query<Person>('SELECT u.id,u.full_name,u.birth_date,u.gender,u.role,u.status,u.photo_key FROM users u JOIN guardianships g ON g.pathfinder_id=u.id WHERE g.guardian_id=? AND g.may_access=1',p.id) : [];
  const enrollments = staff(p) ? await query('SELECT e.*,c.name,c.kind,u.full_name FROM enrollments e JOIN catalog_items c ON c.id=e.catalog_item_id JOIN users u ON u.id=e.user_id ORDER BY e.started_at DESC') : (await Promise.all(visibleIds.map(id=>query('SELECT e.*,c.name,c.kind FROM enrollments e JOIN catalog_items c ON c.id=e.catalog_item_id WHERE e.user_id=? ORDER BY e.started_at DESC',id)))).flat();
  const submissions = staff(p) ? await query('SELECT s.*,r.text AS requirement,c.name AS item_name,u.full_name FROM submissions s JOIN requirements r ON r.id=s.requirement_id JOIN enrollments e ON e.id=s.enrollment_id JOIN catalog_items c ON c.id=e.catalog_item_id JOIN users u ON u.id=e.user_id WHERE s.status<>? ORDER BY s.updated_at DESC LIMIT 100','draft') : (await Promise.all(visibleIds.map(id=>query('SELECT s.*,r.text AS requirement,c.name AS item_name FROM submissions s JOIN requirements r ON r.id=s.requirement_id JOIN enrollments e ON e.id=s.enrollment_id JOIN catalog_items c ON c.id=e.catalog_item_id WHERE e.user_id=? ORDER BY s.updated_at DESC',id)))).flat();
  const requirements = await query('SELECT * FROM requirements ORDER BY catalog_item_id,position');
  const notifications = await query('SELECT id,title,body,read_at,created_at FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50',p.id);
  const boardContacts=director(p)?Object.fromEntries(people.filter(person=>['director','secretary','instructor'].includes(person.role)&&person.phone).map(person=>[person.full_name,person.phone])):{};
  const medical = director(p) ? await query('SELECT * FROM medical_records ORDER BY updated_at DESC LIMIT 200') : (await Promise.all(visibleIds.map(id=>query('SELECT * FROM medical_records WHERE user_id=?',id)))).flat();
  const files = staff(p) ? await query('SELECT id,submission_id,file_name,content_type,size_bytes FROM evidence_files ORDER BY created_at DESC LIMIT 300') : (await Promise.all(visibleIds.map(id=>query('SELECT id,submission_id,file_name,content_type,size_bytes FROM evidence_files WHERE submission_id IN (SELECT id FROM submissions WHERE author_id=?)',id)))).flat();
  return Response.json({authenticated:true,me:p,events,units,catalog,people,dependents,enrollments,submissions,requirements,files,notifications,medical,boardContacts});
 } catch { return fail('Não foi possível carregar os dados. Verifique a configuração do banco.',503); }
}

export async function POST(request: Request) {
 try {
  const body = await request.json() as Record<string, any>;
  const action = String(body.action || '');
  if (action === 'activate') {
    const phone = cleanPhone(String(body.phone||''));
    const code = String(body.code||'').trim();
    const password = String(body.password||'');
    if (password.length < 10 || code.length < 8) return fail('Informe o código e uma senha com pelo menos 10 caracteres.');
    const p = await first<Person>('SELECT * FROM users WHERE phone=? AND status IN (?,?)',phone,'pre_registered','active');
    if (!p) return fail('Cadastro ou código não encontrado.');
    const rows = await query<{id:string;code_hash:string}>('SELECT id,code_hash FROM activation_codes WHERE user_id=? AND used_at IS NULL AND expires_at>? ORDER BY created_at DESC',p.id,stamp());
    let match: string | undefined;
    for (const row of rows) if (row.code_hash === await hash(code)) {match=row.id;break;}
    if (!match) return fail('Cadastro ou código não encontrado.');
    const salt = random();
    await db().batch([
      db().prepare('INSERT INTO credentials (user_id,salt,password_hash,failed_attempts,locked_until) VALUES (?,?,?,0,0) ON CONFLICT(user_id) DO UPDATE SET salt=excluded.salt,password_hash=excluded.password_hash,failed_attempts=0,locked_until=0').bind(p.id,salt,await passwordHash(password,salt)),
      db().prepare('UPDATE activation_codes SET used_at=? WHERE id=? AND used_at IS NULL').bind(stamp(),match),
      db().prepare('UPDATE users SET status=?,updated_at=? WHERE id=?').bind('active',stamp(),p.id),
      db().prepare('DELETE FROM sessions WHERE user_id=?').bind(p.id),
    ]);
    await session(p.id);
    return Response.json({ok:true});
  }
  if (action === 'login') {
    const phone=cleanPhone(String(body.phone||'')); const password=String(body.password||'');
    const p=await first<Person & {salt:string;password_hash:string;failed_attempts:number;locked_until:number}>('SELECT u.*,c.salt,c.password_hash,c.failed_attempts,c.locked_until FROM users u JOIN credentials c ON c.user_id=u.id WHERE u.phone=? AND u.status=?',phone,'active');
    if (!p || p.locked_until>stamp()) return fail('Acesso não autorizado.',401);
    if (await passwordHash(password,p.salt) !== p.password_hash) {
      const count=p.failed_attempts+1;
      await run('UPDATE credentials SET failed_attempts=?,locked_until=? WHERE user_id=?',count,count>=5?stamp()+15*60000:0,p.id);
      return fail('Acesso não autorizado.',401);
    }
    await run('UPDATE credentials SET failed_attempts=0,locked_until=0 WHERE user_id=?',p.id);
    await session(p.id);return Response.json({ok:true});
  }
  const p=await current();if (!p) return fail('Entre na sua conta.',401);
  if(action==='subscribe') {
    const endpoint=String(body.endpoint||'');if(!validEndpoint(endpoint))return fail('Provedor de notificações não reconhecido.');
    await run('INSERT INTO push_subscriptions (endpoint,user_id,created_at) VALUES (?,?,?) ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id,created_at=excluded.created_at',endpoint,p.id,stamp());return Response.json({ok:true});
  }
  if(action==='unsubscribe') {await run('DELETE FROM push_subscriptions WHERE endpoint=? AND user_id=?',String(body.endpoint||''),p.id);return Response.json({ok:true});}
  if (action==='logout') {const token=(await cookies()).get(cookieName)?.value;if(token) await run('DELETE FROM sessions WHERE token_hash=?',await hash(token));(await cookies()).delete(cookieName);return Response.json({ok:true});}
  if (action==='createPerson') {
    if(!director(p)) return fail('Sem permissão.',403);
    const fullName=String(body.fullName||'').trim();const phone=cleanPhone(String(body.phone||''));const role=String(body.role||'');
    if(fullName.length<3||phone.length<10||!['director','secretary','instructor','pathfinder','guardian'].includes(role)) return fail('Dados inválidos.');
    if(['director','secretary','instructor'].includes(role)&&p.role!=='creator')return fail('Somente o criador define funções da diretoria e instrução.',403);
    const birth=String(body.birthDate||'');const gender=String(body.gender||'');
    if(role==='pathfinder' && (!/^\d{4}-\d{2}-\d{2}$/.test(birth)||!['F','M'].includes(gender)||!body.guardianId)) return fail('Informe nascimento, sexo e responsável já cadastrado.');
    if(role==='pathfinder') {const guardian=await first<Person>('SELECT * FROM users WHERE id=? AND role=?',body.guardianId,'guardian');if(!guardian) return fail('Responsável não encontrado.');}
    const age=role==='pathfinder'?ageYears(birth):0;
    if(role==='pathfinder'&&(age<10||age>15))return fail('A unidade atende desbravadores de 10 a 15 anos.');
    const id=crypto.randomUUID();const unit=role==='pathfinder' ? await first<{id:string}>('SELECT id FROM units WHERE gender=? AND min_age<=? AND max_age>=?',gender,age,age) : null;
    await run('INSERT INTO users (id,full_name,phone,birth_date,gender,role,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)',id,fullName,phone,birth||null,gender||null,role,'pre_registered',stamp(),stamp());
    if(role==='pathfinder') {await run('INSERT INTO guardianships (id,pathfinder_id,guardian_id,relationship,may_access) VALUES (?,?,?,?,1)',crypto.randomUUID(),id,body.guardianId,'Responsável');if(unit)await run('INSERT INTO unit_members (unit_id,user_id,member_role) VALUES (?,?,?)',unit.id,id,'pathfinder');}
    await audit(p,'create','user',id);return Response.json({ok:true,id,unit:unit?.id||null});
  }
  if(action==='initialize') {
    if(p.role!=='creator')return fail('Sem permissão.',403);
    const units=[['arara','Arara Azul','F',10,12],['harpia','Harpia','F',13,15],['gaviao','Gavião','M',10,12],['falcao','Falcão','M',13,15]];
    for(const u of units)await run('INSERT OR IGNORE INTO units (id,name,gender,min_age,max_age) VALUES (?,?,?,?,?)',...u);
    const cards=[
      ['amigo','Amigo','10 anos','amigo-e-amigo-da-natureza'],
      ['companheiro','Companheiro','11 anos','companheiro-e-companheiro-de-excursionismo'],
      ['pesquisador','Pesquisador','12 anos','pesquisador-e-pesquisador-de-campo-e-bosque'],
      ['pioneiro','Pioneiro','13 anos','pioneiro-e-pioneiro-de-novas-fronteiras'],
      ['excursionista','Excursionista','14 anos','excursionista-e-excursionista-na-mata'],
      ['guia','Guia','15 anos','guia-e-guia-de-exploracao']
    ];
    for(const [id,name,category,slug] of cards){
      await run('INSERT OR IGNORE INTO catalog_items (id,kind,name,category,source_edition,source_url,active) VALUES (?,?,?,?,?,?,1)',id,'regular_class',name,category,'Cartão DSA publicado em 2017; conferir OMD vigente',`https://www.adventistas.org/pt/desbravadores/classes/${slug}/`);
      await run('INSERT OR IGNORE INTO requirements (id,catalog_item_id,section,position,text,evidence_type) VALUES (?,?,?,?,?,?)',`registro-${id}`,id,'Registro do clube',1,`Registro da conclusão do cartão ${name}. Consulte cada requisito na fonte oficial vinculada.`, 'mixed');
    }
    await run('INSERT OR IGNORE INTO catalog_items (id,kind,name,category,source_edition,source_url,active) VALUES (?,?,?,?,?,?,1)','agrupadas','grouped_class','Classes agrupadas','Ingresso após 10 anos','DSA, requisitos publicados em 2017; conferir OMD vigente','https://www.adventistas.org/pt/desbravadores/classes/classes-agrupadas-requisitos/');
    await run('INSERT OR IGNORE INTO requirements (id,catalog_item_id,section,position,text,evidence_type) VALUES (?,?,?,?,?,?)','registro-agrupadas','agrupadas','Registro do clube',1,'Registro da conclusão dos requisitos agrupados. Consulte as indicações por idade na fonte oficial.','mixed');
    await audit(p,'initialize','catalog','classes-2017');return Response.json({ok:true});
  }
  if(action==='markNotification') {await run('UPDATE notifications SET read_at=? WHERE id=? AND user_id=?',stamp(),body.id,p.id);return Response.json({ok:true});}
  if(action==='issueCode') {
    if(!director(p))return fail('Sem permissão.',403);
    const target=await first<Person>('SELECT * FROM users WHERE id=? AND status IN (?,?)',body.userId,'pre_registered','active');if(!target)return fail('Cadastro não encontrado.');
    const code=String(crypto.getRandomValues(new Uint32Array(1))[0]).padStart(10,'0');
    await run('UPDATE activation_codes SET used_at=? WHERE user_id=? AND used_at IS NULL',stamp(),target.id);
    await run('INSERT INTO activation_codes (id,user_id,code_hash,expires_at,created_by,created_at) VALUES (?,?,?,?,?,?)',crypto.randomUUID(),target.id,await hash(code),stamp()+48*3600000,p.id,stamp());
    await audit(p,'issue_code','user',target.id);return Response.json({ok:true,code,expiresInHours:48});
  }
  if(action==='createEvent') {
    if(!director(p))return fail('Sem permissão.',403);const title=String(body.title||'').trim();const startsAt=localStart(body.startsAt);
    if(title.length<3||!Number.isFinite(startsAt))return fail('Nome e data são obrigatórios.');const id=crypto.randomUUID();
    await run('INSERT INTO events (id,title,description,location,starts_at,ends_at,created_by,created_at) VALUES (?,?,?,?,?,?,?,?)',id,title,String(body.description||''),String(body.location||''),startsAt,null,p.id,stamp());await audit(p,'create','event',id);return Response.json({ok:true});
  }
  if(action==='createSpecialty') {
    if(!director(p))return fail('Sem permissão.',403);
    const name=String(body.name||'').trim(),category=String(body.category||'').trim();
    if(name.length<3||category.length<3)return fail('Informe nome e categoria.');
    const sourceUrl=String(body.sourceUrl||'').trim();
    let verifiedUrl: URL;
    try { verifiedUrl=new URL(sourceUrl); } catch { return fail('Informe o endereço da página oficial da especialidade.'); }
    if(verifiedUrl.protocol!=='https:' || !['adventistas.org','www.adventistas.org'].includes(verifiedUrl.hostname) || !verifiedUrl.pathname.startsWith('/pt/desbravadores/especialidades/'))return fail('Use a página da especialidade no site oficial da DSA.');
    const id=crypto.randomUUID();
    await run('INSERT INTO catalog_items (id,kind,name,category,source_edition,source_url,active) VALUES (?,?,?,?,?,?,1)',id,'specialty',name,category,'Página pública DSA; conferir alterações no Manual 2025',verifiedUrl.href);
    const lines=String(body.requirements||'').split('\n').map((line:string)=>line.trim()).filter(Boolean);
    for(let i=0;i<Math.min(lines.length,100);i++)await run('INSERT INTO requirements (id,catalog_item_id,section,position,text,evidence_type) VALUES (?,?,?,?,?,?)',crypto.randomUUID(),id,'Conferência do clube',i+1,lines[i].slice(0,1500),'mixed');
    await audit(p,'create','specialty',id);return Response.json({ok:true,id});
  }
  if(action==='saveMedical') {
    const userId=String(body.userId||p.id);
    const linked=p.role==='guardian'&&Boolean(await first('SELECT id FROM guardianships WHERE guardian_id=? AND pathfinder_id=? AND may_access=1',p.id,userId));
    if(!director(p)&&!linked)return fail('Somente o responsável ou a direção pode editar a ficha.',403);
    const target=await first<Person>('SELECT * FROM users WHERE id=? AND role=?',userId,'pathfinder');if(!target)return fail('Desbravador não encontrado.');
    const vals=['allergies','medications','conditions','emergencyName','emergencyPhone'].map(k=>String(body[k]||'').slice(0,1000));
    await run('INSERT INTO medical_records (user_id,allergies,medications,conditions,emergency_name,emergency_phone,updated_by,updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET allergies=excluded.allergies,medications=excluded.medications,conditions=excluded.conditions,emergency_name=excluded.emergency_name,emergency_phone=excluded.emergency_phone,updated_by=excluded.updated_by,updated_at=excluded.updated_at',userId,...vals,p.id,stamp());
    await audit(p,'update','medical_record',userId);return Response.json({ok:true});
  }
  if(action==='deleteEvent') {
    if(!director(p))return fail('Sem permissão.',403);
    const event=await first<{id:string}>('SELECT id FROM events WHERE id=?',body.id);if(!event)return fail('Evento não encontrado.');
    await run('DELETE FROM events WHERE id=?',event.id);await audit(p,'delete','event',event.id);return Response.json({ok:true});
  }
  if(action==='updateEvent') {
    if(!director(p))return fail('Sem permissão.',403);
    const title=String(body.title||'').trim(),startsAt=localStart(body.startsAt);
    if(title.length<3||!Number.isFinite(startsAt))return fail('Dados inválidos.');
    const result=await run('UPDATE events SET title=?,location=?,description=?,starts_at=? WHERE id=?',title,String(body.location||''),String(body.description||''),startsAt,body.id);
    if(!result.meta.changes)return fail('Evento não encontrado.');await audit(p,'update','event',body.id);return Response.json({ok:true});
  }
  if(action==='enroll') {
    if(!staff(p) && p.role!=='pathfinder')return fail('Sem permissão.',403);
    const userId=staff(p)?String(body.userId||p.id):p.id;
    const item=await first<{id:string}>('SELECT id FROM catalog_items WHERE id=? AND active=1',body.catalogItemId);if(!item)return fail('Conteúdo não encontrado.');
    await run('INSERT OR IGNORE INTO enrollments (id,user_id,catalog_item_id,status,started_at) VALUES (?,?,?,?,?)',crypto.randomUUID(),userId,item.id,'active',stamp());return Response.json({ok:true});
  }
  if(action==='submit') {
    const enrollment=await first<{id:string;user_id:string}>('SELECT * FROM enrollments WHERE id=?',body.enrollmentId);
    if(!enrollment||enrollment.user_id!==p.id)return fail('Atividade não encontrada.',403);
    const requirement=await first<{id:string}>('SELECT * FROM requirements WHERE id=? AND catalog_item_id=(SELECT catalog_item_id FROM enrollments WHERE id=?)',body.requirementId,enrollment.id);
    if(!requirement)return fail('Requisito não encontrado.');const id=crypto.randomUUID();
    await run('INSERT INTO submissions (id,enrollment_id,requirement_id,author_id,text,status,submitted_at,updated_at) VALUES (?,?,?,?,?,?,?,?)',id,enrollment.id,requirement.id,p.id,String(body.text||'').slice(0,10000),'submitted',stamp(),stamp());await audit(p,'submit','submission',id);
    const reviewers=await query<{id:string}>('SELECT id FROM users WHERE role IN (?,?,?,?) AND status=?','creator','director','secretary','instructor','active');
    for(const reviewer of reviewers)await run('INSERT INTO notifications (id,user_id,title,body,created_at) VALUES (?,?,?,?,?)',crypto.randomUUID(),reviewer.id,'Atividade para avaliar','Um desbravador enviou uma atividade.',stamp());
    await Promise.allSettled(reviewers.map(reviewer=>sendPush(reviewer.id)));
    return Response.json({ok:true,id});
  }
  if(action==='review') {
    if(!staff(p))return fail('Sem permissão.',403);const decision=body.decision;if(!['approved','correction_required'].includes(decision))return fail('Decisão inválida.');
    const sub=await first<{id:string}>('SELECT id FROM submissions WHERE id=? AND status IN (?,?)',body.submissionId,'submitted','correction_required');if(!sub)return fail('Envio não encontrado.');
    await run('INSERT INTO reviews (id,submission_id,reviewer_id,decision,comment,created_at) VALUES (?,?,?,?,?,?)',crypto.randomUUID(),sub.id,p.id,decision,String(body.comment||'').slice(0,2000),stamp());
    await run('UPDATE submissions SET status=?,updated_at=? WHERE id=?',decision,stamp(),sub.id);await audit(p,'review','submission',sub.id);
    const author=await first<{author_id:string}>('SELECT author_id FROM submissions WHERE id=?',sub.id);
    if(author){await run('INSERT INTO notifications (id,user_id,title,body,created_at) VALUES (?,?,?,?,?)',crypto.randomUUID(),author.author_id,decision==='approved'?'Atividade aprovada':'Correção solicitada',String(body.comment||'Confira sua atividade no aplicativo.'),stamp());await sendPush(author.author_id)}
    return Response.json({ok:true});
  }
  return fail('Ação não reconhecida.');
 } catch(e) { if(String(e).includes('UNIQUE'))return fail('Este registro já existe.');return fail('Não foi possível concluir a operação.',500); }
}
