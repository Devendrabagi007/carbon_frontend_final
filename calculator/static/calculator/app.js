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
 const travel=Number($('travel-cut').value),energy=Number($('energy-cut').value);
 const saved=values.travel*travel/100+values.energy*energy/100;scenario=total-saved;
 $('travel-value').textContent=travel+'%';$('energy-value').textContent=energy+'%';
 $('savings').textContent=fmt(saved);$('before').textContent=fmt(total)+' kg';$('after').textContent=fmt(scenario)+' kg';$('percent').textContent=`${fmt(total ? saved/total*100 : 0)}% lower than your current demo estimate.`;
}
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
['travel-cut','energy-cut'].forEach(id=>$(id).addEventListener('input',simulate));
$('save').addEventListener('click',async()=>{
 $('save').disabled=true;
 try{calculate();await api('POST',{...calculatedInputs,travel_cut:$('travel-cut').value,energy_cut:$('energy-cut').value});$('history-status').textContent='Snapshot saved to MySQL.';await renderHistory();}
 catch(error){$('history-status').textContent=error.message;}
 finally{$('save').disabled=false;}
});
$('clear').addEventListener('click',async()=>{
 if(!window.confirm('Clear snapshots saved for this browser?'))return;
 $('clear').disabled=true;
 try{await api('DELETE');await renderHistory();$('history-status').textContent='Saved snapshots cleared.';}
 catch(error){$('history-status').textContent=error.message;}
 finally{$('clear').disabled=false;}
});
calculate();renderHistory().catch(error=>{$('history-status').textContent=error.message;});
