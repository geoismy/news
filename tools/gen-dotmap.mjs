import { geoNaturalEarth1, geoContains } from 'd3-geo';
import { feature } from 'topojson-client';
import fs from 'fs';
const P='/home/claude/news/public/news/lib/dotmap.json'; const out=JSON.parse(fs.readFileSync(P,'utf8'));
const w50 = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-50m.json','utf8'));
const land = feature(w50, w50.objects.land);
const W = 1000, LON0 = 150; // 동경 150°를 가운데로: 한반도·태평양이 중앙, 유럽 왼쪽, 아메리카 오른쪽
const proj = geoNaturalEarth1().rotate([-LON0, 0]).fitWidth(W, {type:'Sphere'});
const H = Math.round(proj([LON0,-90])[1] + 2);
const s = proj.scale(), [tx,ty] = proj.translate();
const step = 6, wd = [];
for (let y = step/2; y < H; y += step) for (let x = step/2; x < W; x += step){
  const ll = proj.invert([x,y]); if (!ll || isNaN(ll[0])) continue;
  const back = proj(ll); if (Math.abs(back[0]-x)>0.5 || Math.abs(back[1]-y)>0.5) continue;
  if (geoContains(land, ll)) wd.push(Math.round(x*10)/10, Math.round(y*10)/10);
}
out.world = {W,H,s:+s.toFixed(4),tx:+tx.toFixed(3),ty:+ty.toFixed(3),r:1.7,lon0:LON0,dots:wd};
fs.writeFileSync(P, JSON.stringify(out));
console.log('world dots', wd.length/2, 'H', H, 'check 서울', proj([127,37.5]).map(v=>v.toFixed(1)), '런던', proj([0,51.5]).map(v=>v.toFixed(1)), '뉴욕', proj([-74,40.7]).map(v=>v.toFixed(1)));
