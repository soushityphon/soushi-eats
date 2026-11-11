import {verifyOwner} from './auth.mjs';
import {cleanState,publicRecipes} from './validation.mjs';
import page from './public/index.html';
const SECURITY={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"};
function json(data,status=200,extra={}){return new Response(JSON.stringify(data),{status,headers:{...SECURITY,'Content-Type':'application/json; charset=utf-8',...extra}})}
async function boundedJson(request){const reader=request.body?.getReader();if(!reader)throw new Error('Empty request');let size=0;const chunks=[];try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>1000000){await reader.cancel();throw new Error('Collection exceeds 1 MB')}chunks.push(value)}}finally{reader.releaseLock()}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}return JSON.parse(new TextDecoder().decode(bytes))}
export default {async fetch(request,env){
 try{const url=new URL(request.url),path=url.pathname;const isAdmin=path==='/admin'||path.startsWith('/admin/');
 if(isAdmin&&!(await verifyOwner(request,env)))return json({error:'Owner sign-in required'},403);
 const safeMethod=request.method==='GET'||request.method==='HEAD';
 if(path==='/api/recipes'){if(!safeMethod)return json({error:'Read-only endpoint'},405,{Allow:'GET, HEAD'});const row=await env.DB.prepare('SELECT data, revision, updated_at FROM app_state WHERE id = 1').first();if(!row)return json({error:'Collection is not ready'},503);const result=json({recipes:publicRecipes(JSON.parse(row.data)),revision:row.revision,updatedAt:row.updated_at});return request.method==='HEAD'?new Response(null,result):result}
 if(path==='/admin/api/state'){
  if(request.method==='GET'){const row=await env.DB.prepare('SELECT data, revision, updated_at FROM app_state WHERE id = 1').first();if(!row)return json({error:'Collection is not ready'},503);return json({...JSON.parse(row.data),revision:row.revision,updatedAt:row.updated_at})}
  if(request.method!=='PUT')return json({error:'Method not allowed'},405,{Allow:'GET, PUT'});
  if(request.headers.get('Origin')!==url.origin||request.headers.get('X-Soushi-Request')!=='save'||!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))return json({error:'Invalid save request'},403);
  const version=request.headers.get('If-Match');if(!version||!/^\d+$/.test(version))return json({error:'Collection revision required'},428);
  let data;try{data=cleanState(await boundedJson(request))}catch(e){return json({error:e.message},400)}
  const revision=Number(version),updatedAt=new Date().toISOString(),payload=JSON.stringify(data);
  const results=await env.DB.batch([
   env.DB.prepare('INSERT INTO state_history (revision, data, updated_at) SELECT revision, data, updated_at FROM app_state WHERE id = 1 AND revision = ?').bind(revision),
   env.DB.prepare('UPDATE app_state SET data = ?, revision = revision + 1, updated_at = ? WHERE id = 1 AND revision = ?').bind(payload,updatedAt,revision),
   env.DB.prepare('DELETE FROM state_history WHERE revision NOT IN (SELECT revision FROM state_history ORDER BY revision DESC LIMIT 30)')
  ]);
  if(results[1].meta.changes!==1)return json({error:'Another tab saved changes. Export your current collection, then reload before editing again.'},409);
  return json({revision:revision+1,updatedAt});
 }
 if(path.startsWith('/api/')||path.startsWith('/admin/api/'))return json({error:'Not found'},404);
 if(!safeMethod)return json({error:'Method not allowed'},405,{Allow:'GET, HEAD'});
 if(path==='/'||path==='/admin'||path==='/admin/'||/^\/recipes\/[a-zA-Z0-9_-]+$/.test(path))return new Response(request.method==='HEAD'?null:page,{headers:{...SECURITY,'Content-Type':'text/html; charset=utf-8'}});
 if(path==='/favicon.ico')return new Response(null,{status:204,headers:SECURITY});return json({error:'Not found'},404);
 }catch(e){console.error(JSON.stringify({event:'request_failed',message:e.name||'Error'}));return json({error:'The collection could not be loaded. Please try again.'},500)}
}};
