import { geoContains, geoBounds } from 'd3-geo';
import { feature } from 'topojson-client';
import fs from 'fs';
const P='/home/claude/news/public/news/lib/dotmap.json'; const out=JSON.parse(fs.readFileSync(P,'utf8'));
const w10 = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-10m.json','utf8'));
const K = out.korea;
const near = feature(w10, w10.objects.countries).features.filter(f=>['China','South Korea','North Korea','Japan','Russia'].includes(f.properties.name));
console.log(near.map(f=>f.properties.name));
const kd=[], ks=5.5;
for (let y = ks/2; y < K.H; y += ks) for (let x = ks/2; x < K.W; x += ks){
  const ll = [K.lon0 + x/(K.cos*K.k), K.lat0 - y/K.k];
  const f = near.find(f=>geoContains(f, ll)); if (!f) continue;
  kd.push(Math.round(x*10)/10, Math.round(y*10)/10, /Korea/.test(f.properties.name)?1:0);
}
K.dots = kd; fs.writeFileSync(P, JSON.stringify(out));
let k=0; for(let i=2;i<kd.length;i+=3) k+=kd[i]; console.log('dots', kd.length/3, 'korea', k);
