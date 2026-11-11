const photoPattern=/^[a-f0-9-]{36}$/;
const recipePattern=/^[a-zA-Z0-9_-]{1,100}$/;
export async function collectionContributions(db,recipes){
 const [notes,photos,covers]=await Promise.all([db.prepare('SELECT recipe_id,user_id,author_name,body,updated_at FROM recipe_notes WHERE body != ?').bind('').all(),db.prepare('SELECT id,recipe_id,user_id,author_name,created_at FROM recipe_photos WHERE deleted_at IS NULL ORDER BY created_at DESC').all(),db.prepare('SELECT recipe_id,mode,photo_id FROM recipe_covers').all()]);
 const result=Object.fromEntries(recipes.map(r=>[r.id,{notes:[],photos:[],cover:{mode:'ai',photoId:null}}]));
 for(const n of notes.results)if(Object.hasOwn(result,n.recipe_id))result[n.recipe_id].notes.push({userId:n.user_id,author:n.author_name,text:n.body,updatedAt:n.updated_at});
 for(const p of photos.results)if(Object.hasOwn(result,p.recipe_id))result[p.recipe_id].photos.push({id:p.id,userId:p.user_id,author:p.author_name,createdAt:p.created_at,url:'/photos/'+p.id});
 for(const c of covers.results)if(Object.hasOwn(result,c.recipe_id)){const entry=result[c.recipe_id];entry.cover={mode:c.mode==='photo'&&entry.photos.some(p=>p.id===c.photo_id)?'photo':'ai',photoId:entry.photos.some(p=>p.id===c.photo_id)?c.photo_id:entry.photos[0]?.id||null}}
 return result;
}
export function validatePhotoImage(value){
 if(typeof value!=='string'||value.length>940000||!/^\/[9]j\/[A-Za-z0-9+/]*={0,2}$/.test(value)||value.length%4!==0)throw Error('Choose a JPEG photo under 700 KB after resizing.');
 const bytes=Uint8Array.from(atob(value),c=>c.charCodeAt(0));if(bytes.length<16||bytes.length>700000||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255||bytes.at(-2)!==255||bytes.at(-1)!==217)throw Error('This photo is not a valid JPEG.');return value;
}
export async function handleContributions(request,env,user,path,url,{json,boundedJson}){
 const match=path.match(/^\/admin\/api\/recipes\/([a-zA-Z0-9_-]+)\/(note|photos|cover)(?:\/([a-f0-9-]+))?$/);if(!match)return null;
 const [,recipeId,kind,photoId]=match;if(!recipePattern.test(recipeId))return json({error:'Recipe not found'},404);
 if(request.headers.get('Origin')!==url.origin||request.headers.get('X-Soushi-Request')!=='save')return json({error:'Invalid save request'},403);
 const row=await env.DB.prepare('SELECT data, revision, updated_at FROM app_state WHERE id = 1').first();if(!row||!JSON.parse(row.data).recipes.some(r=>r.id===recipeId))return json({error:'Recipe not found'},404);
 const now=new Date().toISOString();
 if(kind==='photos'&&photoId&&request.method==='DELETE'){
  if(!photoPattern.test(photoId))return json({error:'Photo not found'},404);const photo=await env.DB.prepare('SELECT user_id FROM recipe_photos WHERE id = ? AND recipe_id = ? AND deleted_at IS NULL').bind(photoId,recipeId).first();if(!photo)return json({error:'Photo not found'},404);if(photo.user_id!==user.id&&user.role!=='owner')return json({error:'Only the uploader or owner can remove this photo'},403);
  await env.DB.prepare('UPDATE recipe_photos SET deleted_at = ? WHERE id = ? AND recipe_id = ?').bind(now,photoId,recipeId).run();return json({ok:true});
 }
 if((kind==='photos'&&request.method!=='POST')||(kind!=='photos'&&request.method!=='PUT')||photoId)return json({error:'Method not allowed'},405);
 if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))return json({error:'Send JSON'},400);
 let data;try{data=await boundedJson(request)}catch(e){return json({error:e.message},400)}
 if(kind==='note'){
  if(typeof data?.text!=='string'||data.text.length>5000)return json({error:'Keep notes under 5,000 characters'},400);
  await env.DB.prepare('INSERT INTO recipe_notes (recipe_id,user_id,author_name,body,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(recipe_id,user_id) DO UPDATE SET author_name=excluded.author_name,body=excluded.body,updated_at=excluded.updated_at').bind(recipeId,user.id,user.name,data.text.trim(),now).run();return json({ok:true});
 }
 if(kind==='photos'){
  let image;try{image=validatePhotoImage(data?.image)}catch(e){return json({error:e.message},400)}
  const id=crypto.randomUUID();const saved=await env.DB.prepare('INSERT INTO recipe_photos (id,recipe_id,user_id,author_name,created_at,image) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM recipe_photos WHERE recipe_id = ? AND deleted_at IS NULL) < 12').bind(id,recipeId,user.id,user.name,now,image,recipeId).run();if(!saved.meta.changes)return json({error:'This recipe already has 12 photos. Remove one before adding another.'},400);return json({ok:true,id},201);
 }
 if(kind==='cover'){
  if(!['ai','photo'].includes(data?.mode))return json({error:'Choose AI artwork or a photo'},400);
  const id=typeof data.photoId==='string'?data.photoId:null;if(id||data.mode==='photo'){if(!id||!photoPattern.test(id)||!await env.DB.prepare('SELECT id FROM recipe_photos WHERE id = ? AND recipe_id = ? AND deleted_at IS NULL').bind(id,recipeId).first())return json({error:'Choose a photo from this recipe'},400)}
  await env.DB.prepare('INSERT INTO recipe_covers (recipe_id,mode,photo_id) VALUES (?,?,?) ON CONFLICT(recipe_id) DO UPDATE SET mode=excluded.mode,photo_id=excluded.photo_id').bind(recipeId,data.mode,id).run();return json({ok:true});
 }
}
export async function serveRecipePhoto(request,env,path,{json,SECURITY}){
 const id=path.slice('/photos/'.length);if(!photoPattern.test(id))return json({error:'Photo not found'},404);
 if(!['GET','HEAD'].includes(request.method))return json({error:'Method not allowed'},405);
 const photo=await env.DB.prepare("SELECT image FROM recipe_photos WHERE id = ? AND deleted_at IS NULL AND EXISTS (SELECT 1 FROM app_state, json_each(app_state.data,'$.recipes') r WHERE json_extract(r.value,'$.id')=recipe_photos.recipe_id)").bind(id).first();if(!photo)return json({error:'Photo not found'},404);
 return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(photo.image),c=>c.charCodeAt(0)),{headers:{...SECURITY,'Content-Type':'image/jpeg','Cache-Control':'public, max-age=300','Content-Disposition':'inline'}});
}
