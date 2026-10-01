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
 const fields=[['walk-km','travel','travel-current','walk-error','km'],['energy-saved','energy','energy-current','energy-error','units'],['items-avoided','shopping','shopping-current','shopping-error','items']];
 let valid=true;const reductions=[];
 fields.forEach(([id,key,current,error,unit])=>{
  const input=$(id), baseline=Number(calculatedInputs[key]), value=Number(input.value);
  input.max=String(baseline);$(current).textContent=`Current monthly amount: ${fmt(baseline)} ${unit}.`;
  const ok=input.value.trim()!==''&&Number.isFinite(value)&&value>=0&&value<=baseline&&(key!=='shopping'||Number.isInteger(value));
  input.setAttribute('aria-invalid',String(!ok));
  $(error).textContent=ok?'':`Enter ${key==='shopping'?'a whole number':'an amount'} from 0 to ${fmt(baseline)} ${unit}.`;
  if(!ok)valid=false;reductions.push(value);
 });
 $('before').textContent=fmt(total)+' kg CO₂e';
 if(!valid){scenario=null;$('after').textContent='—';$('savings').textContent='—';$('savings-label').textContent='Check your amounts';$('simple-message').textContent='Your reductions cannot be more than your current monthly amounts.';['remaining-travel','remaining-energy','remaining-shopping'].forEach(id=>$(id).textContent='');return false;}
 const [walk,electricity,items]=reductions,target=$('diet-target').value;
 const diet=target==='same'?values.food:DEMO_DIET[target];
 scenario=(Number(calculatedInputs.travel)-walk)*.18+(Number(calculatedInputs.energy)-electricity)*.7+(Number(calculatedInputs.shopping)-items)*15+diet;
 const saved=total-scenario;
 $('after').textContent=fmt(scenario)+' kg CO₂e';$('savings').textContent=fmt(Math.abs(saved));$('savings-label').textContent=saved>=0?'kg CO₂e saved / month':'kg CO₂e more / month';
 $('simple-message').textContent=saved>0?'These changes could lower your monthly footprint.':saved<0?'This combination increases your footprint. Try a different food habit or reduce another activity.':'Enter a change on the left to see what you could save.';
 $('remaining-travel').textContent=`Car travel left: ${fmt(Number(calculatedInputs.travel)-walk)} km / month`;
 $('remaining-energy').textContent=`Electricity left: ${fmt(Number(calculatedInputs.energy)-electricity)} units / month`;
 $('remaining-shopping').textContent=`New purchases left: ${fmt(Number(calculatedInputs.shopping)-items)} items / month`;
 return true;
}
function scenarioPayload(){return {...calculatedInputs,walk_km:$('walk-km').value,energy_saved_kwh:$('energy-saved').value,items_avoided:$('items-avoided').value,diet_target:$('diet-target').value};}
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
['walk-km','energy-saved','items-avoided','diet-target'].forEach(id=>$(id).addEventListener('input',simulate));
$('save').addEventListener('click',async()=>{
 $('save').disabled=true;
 try{if(!$('footprint-form').reportValidity())throw new Error('Check your monthly activity inputs first.');calculate();if(!simulate())throw new Error('Check the amounts in the What-If section before saving.');await api('POST',scenarioPayload());$('history-status').textContent='Snapshot saved to your account.';await renderHistory();}
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


$('simple-form').addEventListener('submit',event=>{event.preventDefault();if(!$('footprint-form').reportValidity())return;calculate();if(!simulate())document.querySelector('#simple-form [aria-invalid="true"]').focus();});
$('reset-simple').addEventListener('click',()=>{['walk-km','energy-saved','items-avoided'].forEach(id=>$(id).value='0');$('diet-target').value='same';simulate();});
