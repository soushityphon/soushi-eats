import {readFile,mkdir,writeFile,readdir} from 'node:fs/promises';
const [auth,validation,worker,html]=await Promise.all(['auth.mjs','validation.mjs','worker.mjs','public/index.html'].map(p=>readFile(new URL(p,import.meta.url),'utf8')));
const icons=Object.fromEntries(await Promise.all(['favicon.ico','favicon-32.png','icon-192.png','apple-touch-icon.png'].map(async name=>['/'+name,{type:name.endsWith('.ico')?'image/x-icon':'image/png',data:(await readFile(new URL('public/'+name,import.meta.url))).toString('base64')}])));
for(const name of await readdir(new URL('public/recipe-art/',import.meta.url))){if(name.endsWith('.webp'))icons['/recipe-art/'+name]={type:'image/webp',data:(await readFile(new URL('public/recipe-art/'+name,import.meta.url))).toString('base64')}}
const source=auth+'\n'+validation+'\n'+worker.replace(/^import .*;\n/gm,'').replace('const SECURITY=', ()=> 'const page='+JSON.stringify(html)+';\nconst icons='+JSON.stringify(icons)+';\nconst SECURITY=');
await mkdir(new URL('dist/',import.meta.url),{recursive:true});await writeFile(new URL('dist/worker.mjs',import.meta.url),source);console.log('Built dist/worker.mjs');

// Pages advanced mode uses the same compiled request handler.
await mkdir(new URL('dist/pages/',import.meta.url),{recursive:true});
await writeFile(new URL('dist/pages/_worker.js',import.meta.url),source);
await writeFile(new URL('dist/pages/_routes.json',import.meta.url),JSON.stringify({version:1,include:['/*'],exclude:[]}));
console.log('Built dist/pages/_worker.js');
