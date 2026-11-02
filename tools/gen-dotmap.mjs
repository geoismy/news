import { geoNaturalEarth1, geoContains } from 'd3-geo';
import { feature } from 'topojson-client';
import fs from 'fs';
const load = f => JSON.parse(fs.readFileSync(`node_modules/world-atlas/${f}`,'utf8'));
// ── 세계: Natural Earth 투영, 가로 1000
const w110 = load('countries-50m.json');
const land = feature(w110, w110.objects.land);
const W = 1000;
const proj = geoNaturalEarth1().fitWidth(W, {type:'Sphere'});
const H = Math.round(proj([0,-90])[1] + 2);
const s = proj.scale(), [tx,ty] = proj.translate();
const step = 6, wd = [];
for (let y = step/2; y < H; y += step) for (let x = step/2; x < W; x += step){
  const ll = proj.invert([x,y]); if (!ll || isNaN(ll[0])) continue;
  const back = proj(ll); if (Math.abs(back[0]-x)>0.5 || Math.abs(back[1]-y)>0.5) continue; // 지도 밖
  if (geoContains(land, ll)) wd.push(Math.round(x*10)/10, Math.round(y*10)/10);
}
// ── 한반도 삽입 지도: 등장방형(위도 37.5° 보정)
const w10 = load('countries-10m.json');
const all10 = feature(w10, w10.objects.countries).features;
const land10 = feature(w10, w10.objects.land);
const kor = all10.filter(f=>['South Korea','North Korea','Korea','Dem. Rep. Korea'].includes(f.properties.name));
const K = {lon0:124.2, lon1:131.0, lat0:42.6, lat1:33.0, cos:Math.cos(37.5*Math.PI/180)};
K.k = 420/(K.lat0-K.lat1); K.W = Math.round((K.lon1-K.lon0)*K.cos*K.k); K.H = 420;
const kd = [], ks = 5.5;
for (let y = ks/2; y < K.H; y += ks) for (let x = ks/2; x < K.W; x += ks){
  const ll = [K.lon0 + x/(K.cos*K.k), K.lat0 - y/K.k];
  if (!geoContains(land10, ll)) continue;
  const isK = kor.some(f=>geoContains(f, ll)) ? 1 : 0;
  kd.push(Math.round(x*10)/10, Math.round(y*10)/10, isK);
}
const out = {world:{W,H,s:+s.toFixed(4),tx:+tx.toFixed(3),ty:+ty.toFixed(3),r:1.7,dots:wd}, korea:{...K, r:1.6, dots:kd}};
console.log('korea features:', kor.map(f=>f.properties.name), 'world dots', wd.length/2, 'H', H, 'korea dots', kd.length/3, 'K', K.W+'x'+K.H);
fs.writeFileSync('/home/claude/news/public/news/lib/dotmap.json', JSON.stringify(out));
// 확인용: 런타임 공식과 d3 결과 비교
const ne = (l,p)=>{ l*=Math.PI/180; p*=Math.PI/180; const p2=p*p,p4=p2*p2;
  return [l*(0.8707-0.131979*p2+p4*(-0.013791+p4*(0.003971*p2-0.001529*p4))), p*(1.007226+p2*(0.015085+p4*(-0.044475+0.028874*p2-0.005916*p4)))]; };
for (const [lng,lat] of [[127,37.5],[-74,40.7],[0,-80],[150,-33]]){ const [X,Y]=ne(lng,lat); console.log([lng,lat], proj([lng,lat]).map(v=>v.toFixed(2)), [tx+s*X, ty-s*Y].map(v=>v.toFixed(2))); }
