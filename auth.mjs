// Public signing keys only, never session tokens or user data.
let keyCache={issuer:'',expires:0,keys:[]};
const bytes=s=>Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
export async function verifyOwner(request,env){
 const issuer=env.ACCESS_ISSUER,audience=env.ACCESS_AUD,email=env.OWNER_EMAIL;
 if(!issuer||!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer)||!audience||!email)return false;
 const token=request.headers.get('Cf-Access-Jwt-Assertion');if(!token||token.length>16000)return false;
 try{const parts=token.split('.');if(parts.length!==3)return false;const header=JSON.parse(new TextDecoder().decode(bytes(parts[0]))),claims=JSON.parse(new TextDecoder().decode(bytes(parts[1])));if(header.alg!=='RS256'||!header.kid||header.crit)return false;const now=Math.floor(Date.now()/1000);if(claims.iss!==issuer||!Array.isArray(claims.aud)||!claims.aud.includes(audience)||typeof claims.exp!=='number'||claims.exp<=now||typeof claims.iat!=='number'||claims.iat>now+30||(claims.nbf!=null&&(typeof claims.nbf!=='number'||claims.nbf>now+30))||typeof claims.email!=='string'||claims.email.toLowerCase()!==email.toLowerCase())return false;
 if(keyCache.issuer!==issuer||keyCache.expires<Date.now()||!keyCache.keys.some(k=>k.kid===header.kid)){const response=await fetch(issuer+'/cdn-cgi/access/certs',{signal:AbortSignal.timeout(5000)});if(!response.ok)return false;const data=await response.json();if(!Array.isArray(data.keys))return false;keyCache={issuer,expires:Date.now()+3600000,keys:data.keys}}
 const jwk=keyCache.keys.find(k=>k.kid===header.kid&&k.kty==='RSA'&&(!k.use||k.use==='sig'));if(!jwk)return false;const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);return await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,bytes(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));
 }catch{return false}
}
