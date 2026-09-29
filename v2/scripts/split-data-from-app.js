// Regenerates data/*.json from the inline data in app/index.html. Run from repo root: node scripts/split-data-from-app.js
const fs=require('fs');
const s=fs.readFileSync('app/index.html','utf8');
let js=s.split('<script>')[1].split('</script>')[0];
const core=js.split('/* ============================================================\n   3. VENUES')[0];
// Venue data only: stop before the API-mode section (3b), which needs a browser.
const ven='/*'+js.split('/* ============================================================\n   3. VENUES')[1].split('/* ============================================================\n   3b. API MODE')[0];
const rec=js.split('/* ---------- Traction HUD')[1].split('const tickerEl')[0].replace(/^[^\n]*\n/,'');
const m={exports:{}};
new Function('module', core+ven+rec+'\nmodule.exports={ASSETS,CATEGORIES,ALIASES,ENTITIES,COUNTRIES,VENUES,RECENT};')(m);
const d=m.exports;
const w=(n,o)=>fs.writeFileSync('data/'+n,JSON.stringify(o,null,2));
const slug=x=>x.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/_$/,'');
w('assets.json',{version:'1.0',assets:d.ASSETS.map((name,i)=>({id:slug(name),index:i,name}))});
w('categories.json',{version:'1.0',categories:Object.entries(d.CATEGORIES).map(([name,assets])=>({id:slug(name),name,assets}))});
w('aliases.json',{version:'1.0',aliases:d.ALIASES});
w('entities.json',{version:'1.0',entities:d.ENTITIES});
// Rules are keyed by asset id. Statuses come from the app; sources and verified_at are kept from the
// existing countries.json so regenerating never wipes provenance.
const ids=d.ASSETS.map(slug);
let prev={};try{prev=JSON.parse(fs.readFileSync('data/countries.json','utf8'));}catch{}
const old=(code,who,id)=>{const c=(prev.countries||[]).find(x=>x.code===code);const r=c&&c.rules&&c.rules[who];return r&&!Array.isArray(r)?r[id]:null;};
const keyed=(c,who)=>Object.fromEntries(ids.map((id,i)=>{const o=old(c.code,who,id);return[id,{status:c[who][i],sources:o?o.sources:[],verified_at:o?o.verified_at:null}];}));
w('countries.json',{version:'2.0',statusScale:{'2':'can_own','1':'conditional','0':'cannot_own'},countries:d.COUNTRIES.map(c=>({code:c.code,name:c.name,flag:c.flag,rules:{citizen:keyed(c,'citizen'),foreigner:keyed(c,'foreigner')}}))});
w('venues.json',{version:'1.0',ref:'ref=vestail',venues:d.VENUES});
w('activity.sample.json',{version:'1.0',stats:{volume_30d_usd:48300000,volume_30d_delta_pct:18,orders_routed:12640,orders_delta_pct:9,active_buyers_7d:2310},recent:d.RECENT.map(([flag,asset,venue,ago])=>({flag,asset,venue,ago}))});
console.log(Object.keys(d).map(k=>k+':'+(Array.isArray(d[k])?d[k].length:Object.keys(d[k]).length)).join(' '));
