import {readFile,mkdir,writeFile} from 'node:fs/promises';
const [auth,validation,worker,html]=await Promise.all(['auth.mjs','validation.mjs','worker.mjs','public/index.html'].map(p=>readFile(new URL(p,import.meta.url),'utf8')));
const source=auth+'\n'+validation+'\n'+worker.replace(/^import .*;\n/gm,'').replace('const SECURITY=', ()=> 'const page='+JSON.stringify(html)+';\nconst SECURITY=');
await mkdir(new URL('dist/',import.meta.url),{recursive:true});await writeFile(new URL('dist/worker.mjs',import.meta.url),source);console.log('Built dist/worker.mjs');

// Pages advanced mode uses the same compiled request handler.
await mkdir(new URL('dist/pages/',import.meta.url),{recursive:true});
await writeFile(new URL('dist/pages/_worker.js',import.meta.url),source);
await writeFile(new URL('dist/pages/_routes.json',import.meta.url),JSON.stringify({version:1,include:['/*'],exclude:[]}));
console.log('Built dist/pages/_worker.js');
