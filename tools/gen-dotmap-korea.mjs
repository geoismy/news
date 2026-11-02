import { geoContains } from 'd3-geo';
import { feature } from 'topojson-client';
import fs from 'fs';
const P='/home/claude/news/public/news/lib/dotmap.json'; const out=JSON.parse(fs.readFileSync(P,'utf8'));
const w10 = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-10m.json','utf8'));
// 동쪽을 132.4°까지 넓혀 울릉도(130.9°)·독도(131.87°)가 들어오게
const K = {lon0:119.6, lon1:134.0, lat0:42.6, lat1:33.0, cos:Math.cos(37.5*Math.PI/180)}; // 세계 지도처럼 넓게(가로:세로 ≈ 1.2)
K.k = 420/(K.lat0-K.lat1); K.W = Math.round((K.lon1-K.lon0)*K.cos*K.k); K.H = 420; K.r = 1.6;
const near = feature(w10, w10.objects.countries).features.filter(f=>['China','South Korea','North Korea','Japan','Russia'].includes(f.properties.name));
const kd=[], ks=5.5;
for (let y = ks/2; y < K.H; y += ks) for (let x = ks/2; x < K.W; x += ks){
  const ll = [K.lon0 + x/(K.cos*K.k), K.lat0 - y/K.k];
  const f = near.find(f=>geoContains(f, ll)); if (!f) continue;
  kd.push(Math.round(x*10)/10, Math.round(y*10)/10, /Korea/.test(f.properties.name)?1:0);
}
K.dots = kd; out.korea = K; fs.writeFileSync(P, JSON.stringify(out));
console.log('K', K.W+'x'+K.H, 'dots', kd.length/3);
