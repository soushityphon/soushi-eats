import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const ctx=vm.createContext({canonicalUnit:u=>u.toLowerCase()});
vm.runInContext(html.split('// BEGIN METHOD INGREDIENT NAMES')[1].split('// END METHOD INGREDIENT NAMES')[0],ctx);
const ingredients=[{id:'cream',name:'Cream',unit:'ml'},{id:'sugar',name:'Caster sugar',unit:'g'},{id:'salt',name:'Salt',unit:'as_needed'},{id:'eggs',name:'Eggs',unit:'count'}];
test('bare amount lists retain ingredient names in instructions',()=>{
 const result=ctx.completeMethodNames('Add {cream}, {sugar} and {salt}.',ingredients);
 assert.equal(result,'Add {cream} of cream, {sugar} of caster sugar and salt ({salt}).');
 assert.equal(ctx.completeMethodNames(result,ingredients),result);
});
test('existing names, count names and preparation wording remain intact',()=>{
 for(const text of ['Add {cream} of cold cream.','Mix in {eggs}.','Add {cream} cream.','Whip the whites from {eggs}.'])assert.equal(ctx.completeMethodNames(text,ingredients),text);
 assert.equal(ctx.completeMethodNames('Press {sugar} together with butter.',ingredients),'Press {sugar} of caster sugar together with butter.');
 assert.equal(ctx.completeMethodNames('Add {sugar} one tablespoon at a time.',ingredients),'Add {sugar} of caster sugar one tablespoon at a time.');
});
