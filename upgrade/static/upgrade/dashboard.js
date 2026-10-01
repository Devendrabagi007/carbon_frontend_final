'use strict';
// Illustrative demo factors; the Django endpoint uses the same values.
const DEMO_FACTORS = {travel: 0.18, energy: 0.70, shopping: 15};
const DEMO_DIET = {plant: 70, vegetarian: 100, mixed: 160};
const labels = {travel: 'Travel', energy: 'Home energy', food: 'Food', shopping: 'Lifestyle'};
const colors = {travel: '#246641', energy: '#7d985a', food: '#b0c584', shopping: '#dbc788'};
const $ = id => document.getElementById(id);
const fmt = value => value.toLocaleString(undefined, {maximumFractionDigits: 1});
let values = {}, total = 0, scenario = 0;
let calculatedInputs = {};
function calculate(){
 calculatedInputs = {travel:$('travel').value,energy:$('energy').value,food:$('food').value,shopping:$('shopping').value};
 values = {travel: Number($('travel').value)*DEMO_FACTORS.travel, energy: Number($('energy').value)*DEMO_FACTORS.energy, food: DEMO_DIET[$('food').value], shopping: Number($('shopping').value)*DEMO_FACTORS.shopping};
 total = Object.values(values).reduce((a,b)=>a+b,0);
 $('total').textContent=fmt(total);
 $('breakdown').replaceChildren();
 Object.entries(values).forEach(([key,value])=>{
 const row=document.createElement('div'); row.className='bar-row';
 const label=document.createElement('div');label.className='bar-label';
 const name=document.createElement('span');name.textContent=labels[key];
 const number=document.createElement('span');number.textContent=`${fmt(value)} kg · ${fmt(total ? value/total*100 : 0)}%`;
 label.append(name,number);
 const track=document.createElement('div');track.className='bar-track';
 const fill=document.createElement('div');fill.className='bar-fill';fill.style.width=`${total ? value/total*100 : 0}%`;fill.style.background=colors[key];track.append(fill);row.append(label,track);$('breakdown').append(row);
 });
 const ranked=Object.keys(values).sort((a,b)=>values[b]-values[a]);
 $('main-insight').textContent=`${labels[ranked[0]]} is your largest category in this demo. Start by exploring changes there.`;
 const tips={travel:['Rethink a short trip','Consider walking or cycling for short journeys where it is safe and practical. Explore the effect in the simulator.'],energy:['Give electricity a closer look','Switch off unused appliances and review your lighting and cooling habits.'],food:['Try a plant-rich meal','Explore more plant-based meals and plan portions to reduce food waste.'],shopping:['Use what you already have','Repair, reuse or borrow an item before buying something new.']};
 $('recommendations').replaceChildren();
 ranked.slice(0,3).forEach((key,index)=>{const card=document.createElement('article');card.className='recommendation';const n=document.createElement('span');n.className='number';n.textContent=`0${index+1} / ${labels[key].toUpperCase()}`;const h=document.createElement('h3');h.textContent=tips[key][0];const p=document.createElement('p');p.textContent=tips[key][1];card.append(n,h,p);$('recommendations').append(card);});
 simulate();
}
function simulate(){
 const travel=Number($('travel-cut').value), energy=Number($('energy-cut').value), solar=Number($('solar-cut').value), shopping=Number($('shopping-cut').value);
 const target=$('diet-target').value;
 const foodAfter=target==='same'?values.food:DEMO_DIET[target];
 const changes={travel:values.travel*travel/100,energy:values.energy*(1-(1-energy/100)*(1-solar/100)),food:values.food-foodAfter,shopping:values.shopping*shopping/100};
 const saved=Object.values(changes).reduce((a,b)=>a+b,0);scenario=Math.max(0,total-saved);
 ['travel','energy','solar','shopping'].forEach(key=>$(key+'-value').textContent=$(key+'-cut').value+'%');
 $('savings').textContent=fmt(Math.abs(saved));$('savings-label').textContent='kg CO₂e '+(saved>=0?'less':'more')+' / month';
 $('before').textContent=fmt(total)+' kg';$('after').textContent=fmt(scenario)+' kg';
 const percent=total?saved/total*100:0;
 $('percent').textContent=`${fmt(Math.abs(percent))}% ${saved>=0?'lower':'higher'} than your current estimate.`;
 $('annual-savings').textContent=fmt(Math.abs(saved)*12)+' kg';$('annual-label').textContent=saved>=0?'potential CO₂e savings':'additional CO₂e emissions';
 $('change-breakdown').replaceChildren();Object.entries(changes).forEach(([key,value])=>{const row=document.createElement('div');const name=document.createElement('span');name.textContent=labels[key];const amount=document.createElement('b');amount.textContent=(value>=0?'−':'+')+fmt(Math.abs(value))+' kg';row.append(name,amount);$('change-breakdown').append(row);});
 const goal=Number($('goal').value);$('goal-value').textContent=goal+'%';$('goal-progress').value=Math.max(0,Math.min(100,percent/goal*100));
 $('goal-status').textContent=percent>=goal?'Goal reached in this scenario. Nice progress!':`${fmt(Math.max(0,total*goal/100-saved))} kg more to reduce to reach your goal.`;
}
function scenarioPayload(){return {...calculatedInputs,travel_cut:$('travel-cut').value,energy_cut:$('energy-cut').value,solar_cut:$('solar-cut').value,shopping_cut:$('shopping-cut').value,diet_target:$('diet-target').value};}
function csrfToken(){const item=document.cookie.split('; ').find(row=>row.startsWith('csrftoken='));return item?decodeURIComponent(item.split('=').slice(1).join('=')):'';}
async function api(method='GET',body=null){
 const options={method,credentials:'same-origin',headers:{'X-CSRFToken':csrfToken()}};
 if(body!==null){options.headers['Content-Type']='application/json';options.body=JSON.stringify(body);}
 const response=await fetch('/api/snapshots/',options);
 let data;try{data=await response.json();}catch{throw new Error('The server returned an error. Check the Django or Vercel logs.');}
 if(!response.ok)throw new Error(data.error||'The request failed.');
 return data;
}
async function renderHistory(){
 const data=await api();$('history').replaceChildren();
 if(!data.records.length){const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=3;cell.textContent='No snapshots saved yet. Calculate your footprint, then save a snapshot.';row.append(cell);$('history').append(row);return;}
 data.records.forEach(record=>{const row=document.createElement('tr');[record.created_at,fmt(record.total_kg)+' kg CO₂e',fmt(record.scenario_kg)+' kg CO₂e'].forEach(value=>{const cell=document.createElement('td');cell.textContent=value;row.append(cell);});$('history').append(row);});
}
$('footprint-form').addEventListener('submit',event=>{event.preventDefault();calculate();$('result-status').textContent='Updated using your submitted inputs.';});
$('footprint-form').addEventListener('input',()=>{$('result-status').textContent='Inputs changed. Select Calculate to update your results.';});
$('footprint-form').addEventListener('reset',()=>{setTimeout(()=>{calculate();$('result-status').textContent='Sample inputs restored.';},0);});
['travel-cut','energy-cut','solar-cut','shopping-cut','diet-target','goal'].forEach(id=>$(id).addEventListener('input',simulate));
$('save').addEventListener('click',async()=>{
 $('save').disabled=true;
 try{calculate();await api('POST',scenarioPayload());$('history-status').textContent='Snapshot saved to your account.';await renderHistory();}
 catch(error){$('history-status').textContent=error.message;}
 finally{$('save').disabled=false;}
});
$('clear').addEventListener('click',async()=>{
 if(!window.confirm('Clear all snapshots saved to your account?'))return;
 $('clear').disabled=true;
 try{await api('DELETE');await renderHistory();$('history-status').textContent='Saved snapshots cleared.';}
 catch(error){$('history-status').textContent=error.message;}
 finally{$('clear').disabled=false;}
});
calculate();renderHistory().catch(error=>{$('history-status').textContent=error.message;});

const presetValues={gentle:[10,10,0,10,'same'],balanced:[30,20,25,30,'vegetarian'],ambitious:[60,35,75,60,'plant']};
function setScenario(preset){['travel-cut','energy-cut','solar-cut','shopping-cut','diet-target'].forEach((id,index)=>$(id).value=preset[index]);simulate();}
document.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>{setScenario(presetValues[button.dataset.preset]);$('scenario-status').textContent=button.textContent.trim()+' preset applied.';}));
$('reset-scenario').addEventListener('click',()=>{setScenario([0,0,0,0,'same']);$('scenario-status').textContent='All scenario changes reset.';});
let comparisons=[];
$('pin-scenario').addEventListener('click',()=>{
 if(comparisons.length>=3){$('scenario-status').textContent='Three scenarios added. Clear the comparison to start again.';return;}
 const entry={...scenarioPayload(),total,scenario};comparisons.push(entry);$('scenario-comparison').hidden=false;
 const card=document.createElement('article');card.className='comparison-card';
 const title=document.createElement('h3');title.textContent='Scenario '+comparisons.length;
 const result=document.createElement('strong');result.textContent=fmt(scenario)+' kg / month';
 const savings=document.createElement('p');savings.textContent=`${fmt(total-scenario)} kg saved against ${fmt(total)} kg baseline.`;
 const detail=document.createElement('p');detail.className='quiet';detail.textContent=`Travel −${entry.travel_cut}% · Electricity −${entry.energy_cut}% · Renewables ${entry.solar_cut}% · Purchases −${entry.shopping_cut}% · Diet: ${entry.diet_target}`;
 card.append(title,result,savings,detail);$('comparison-cards').append(card);$('scenario-status').textContent='Scenario '+comparisons.length+' added to the comparison below.';
});
$('clear-comparisons').addEventListener('click',()=>{comparisons=[];$('comparison-cards').replaceChildren();$('scenario-comparison').hidden=true;$('scenario-status').textContent='Comparison cleared.';});
$('export-scenario').addEventListener('click',()=>{
 const data=scenarioPayload();const rows=[['CarbonCalculator illustrative scenario','Value'],...Object.entries(data),['baseline_kg_month',total.toFixed(2)],['scenario_kg_month',scenario.toFixed(2)],['savings_kg_year',((total-scenario)*12).toFixed(2)]];
 const csv=rows.map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const link=document.createElement('a');link.href=url;link.download='my-carbon-scenario.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('scenario-status').textContent='Your scenario CSV has been exported.';
});
