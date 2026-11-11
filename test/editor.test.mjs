import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';
import {cleanRecipe,cleanState} from '../validation.mjs';
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const source=html.split('// BEGIN RECIPE EDITOR MODEL')[1].split('// END RECIPE EDITOR MODEL')[0];
const ctx=vm.createContext({crypto,structuredClone});vm.runInContext(source,ctx);
const model=recipe=>ctx.recipeToEditor(recipe);
const build=draft=>cleanRecipe(structuredClone(ctx.recipeFromEditor(draft)));
const seed=JSON.parse(fs.readFileSync(new URL('../seed.json',import.meta.url),'utf8'));
const recipe=seed.recipes?seed.recipes[0]:seed[0]||seed;
test('details edits preserve ingredient references, tips, timers and private state',()=>{
 const original=structuredClone(recipe);original.steps[0].timers=[{label:'Warm',seconds:45}];
 const draft=model(original);draft.title='Updated cake';draft.description='New description';draft.tags='dessert, tea, dessert';
 const edited=build(draft);assert.equal(edited.title,'Updated cake');assert.deepEqual(edited.tags,['dessert','tea']);
 assert.deepEqual(edited.ingredients,original.ingredients.map(i=>({...i,note:i.note||''})));
 assert.deepEqual(edited.steps,original.steps);assert.equal(original.title,recipe.title);
 const privateState={notes:'Keep this note',favourite:true,ingredients:[original.ingredients[0].id],steps:[0]};
 const saved=cleanState({recipes:[edited],states:{[edited.id]:privateState},preferences:{temperature:'F'},densities:{}});
 assert.deepEqual(saved.states[edited.id],privateState);assert.equal(saved.preferences.temperature,'F');
});
test('manual entry accepts fractions and builds a valid recipe with no imported script',()=>{
 const draft=model();draft.title='Simple rice';draft.description='A manual recipe';draft.ingredients[0].name='Rice';draft.ingredients[0].amount='1½';draft.ingredients[0].unit='cup';
 draft.steps[0].text='Cook {'+draft.ingredients[0].base.id+'} rice for 20 minutes.';
 const saved=build(draft);assert.equal(saved.ingredients[0].amount,1.5);assert.equal(saved.steps[0].title,'Step 1');assert.equal(saved.oven,null);assert.equal(saved.measurementStandard,'AU');
 for(const [value,expected] of [['1/2',.5],['2 1/3',2+1/3],['¾',.75],['.5',.5],['0.125',.125]])assert.equal(ctx.editorNumber(value,'Amount'),expected);
 for(const value of ['1/0','abc','Infinity'])assert.throws(()=>ctx.editorNumber(value,'Amount'));
});
test('reordering ingredients keeps IDs and scaled method references attached',()=>{
 const draft=model(recipe),first=draft.ingredients[0].base.id;draft.ingredients.reverse();
 const edited=build(draft);assert.equal(edited.ingredients.at(-1).id,first);assert.deepEqual(edited.steps,recipe.steps);
});
test('changing ingredient identity clears obsolete conversion metadata',()=>{
 const original=structuredClone(recipe);original.ingredients[0].gramsPerMl=1.2;original.ingredients[0].volumeMl=250;
 const draft=model(original);draft.ingredients[0].name='Different ingredient';assert.equal(build(draft).ingredients[0].gramsPerMl,undefined);
 draft.ingredients[0].unit='kg';assert.equal(build(draft).ingredients[0].volumeMl,undefined);
});
test('qualitative amounts, ranges, Fahrenheit and optional timing survive edits',()=>{
 const draft=model(recipe);draft.ingredients[0].unit='to_taste';draft.ingredients[0].amount='';draft.ingredients[1].maxAmount='300';draft.temperature='400';draft.temperatureUnit='F';draft.bakeMin='20';draft.bakeMax='';
 const saved=build(draft);assert.equal(saved.ingredients[0].amount,null);assert.equal(saved.ingredients[1].maxAmount,300);assert.deepEqual(saved.oven,{value:400,unit:'F',mode:recipe.oven.mode});assert.deepEqual(saved.bakeMinutes,[20,20]);
});
test('invalid or incomplete edits cannot become a saved recipe',()=>{
 const draft=model(recipe);draft.title='';assert.throws(()=>build(draft),/title/);draft.title='Cake';draft.ingredients[0].amount='-1';assert.throws(()=>build(draft),/amount/);
 draft.ingredients[0].amount='1';draft.steps[0].text='Use {missing}';assert.throws(()=>build(draft),/reference/);
 draft.steps[0].text='Mix';draft.steps[0].timers=[{label:'Bad',seconds:0}];assert.throws(()=>build(draft),/Timer/);
 draft.steps[0].timers=null;draft.bakeMin='40';draft.bakeMax='30';assert.throws(()=>build(draft),/bake/);
});
