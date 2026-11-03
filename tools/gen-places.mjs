// 지도 위치 목록 만들기: 나라 + 대륙·바다·극지 + 우리나라 시도·시군 + 섬·산·하천·바다 + 북한 주요 도시
// 입력: world-atlas(50m), southkorea-maps kostat 2013 (/tmp/geo, 읽기만)
// 출력: places.csv (사람·n8n용), places.json (사이트용)
import { geoCentroid, geoArea } from 'd3-geo';
import { feature } from 'topojson-client';
import fs from 'fs';

const OUT = process.argv[2];
const rows = [];   // [이름, 종류, 위도, 경도, 별칭]
const add = (name, kind, lat, lng, alias='') => rows.push([name, kind, +lat.toFixed(3), +lng.toFixed(3), alias]);

// 큰 조각(본토)의 중심. 여러 조각이면 가장 넓은 조각 기준
function mainCentroid(geom){
  if (geom.type === 'Polygon') { const [x,y] = geoCentroid({type:'Feature',geometry:geom}); return [y,x]; }
  let best = null, area = -1;
  for (const poly of geom.coordinates){ const g = {type:'Polygon', coordinates:poly}; const a = geoArea(g); if (a > area){ area = a; best = g; } }
  const [x,y] = geoCentroid({type:'Feature',geometry:best}); return [y,x];
}
// 여러 조각을 합친 면적 가중 중심 (섬이 많은 군도 포함)
function allCentroid(feats){
  const polys = [];
  for (const f of feats){ const g = f.geometry; if (g.type==='Polygon') polys.push(g.coordinates); else polys.push(...g.coordinates); }
  const [x,y] = geoCentroid({type:'Feature', geometry:{type:'MultiPolygon', coordinates:polys}}); return [y,x];
}

// ── 1. 나라 (world-atlas 영어 이름 → 한국어)
const KO = {"Afghanistan":"아프가니스탄","Albania":"알바니아","Algeria":"알제리","Andorra":"안도라","Angola":"앙골라","Antigua and Barb.":"앤티가 바부다","Argentina":"아르헨티나","Armenia":"아르메니아","Australia":"호주","Austria":"오스트리아","Azerbaijan":"아제르바이잔","Bahamas":"바하마","Bahrain":"바레인","Bangladesh":"방글라데시","Barbados":"바베이도스","Belarus":"벨라루스","Belgium":"벨기에","Belize":"벨리즈","Benin":"베냉","Bhutan":"부탄","Bolivia":"볼리비아","Bosnia and Herz.":"보스니아 헤르체고비나","Botswana":"보츠와나","Brazil":"브라질","Brunei":"브루나이","Bulgaria":"불가리아","Burkina Faso":"부르키나파소","Burundi":"부룬디","Cabo Verde":"카보베르데","Cambodia":"캄보디아","Cameroon":"카메룬","Canada":"캐나다","Central African Rep.":"중앙아프리카공화국","Chad":"차드","Chile":"칠레","China":"중국","Colombia":"콜롬비아","Comoros":"코모로","Congo":"콩고","Costa Rica":"코스타리카","Croatia":"크로아티아","Cuba":"쿠바","Cyprus":"키프로스","Czechia":"체코","Côte d'Ivoire":"코트디부아르","Dem. Rep. Congo":"콩고민주공화국","Denmark":"덴마크","Djibouti":"지부티","Dominica":"도미니카연방","Dominican Rep.":"도미니카공화국","Ecuador":"에콰도르","Egypt":"이집트","El Salvador":"엘살바도르","Eq. Guinea":"적도기니","Eritrea":"에리트레아","Estonia":"에스토니아","Ethiopia":"에티오피아","Fiji":"피지","Finland":"핀란드","France":"프랑스","Gabon":"가봉","Gambia":"감비아","Georgia":"조지아","Germany":"독일","Ghana":"가나","Greece":"그리스","Greenland":"그린란드","Grenada":"그레나다","Guam":"괌","Guatemala":"과테말라","Guinea":"기니","Guinea-Bissau":"기니비사우","Guyana":"가이아나","Haiti":"아이티","Honduras":"온두라스","Hong Kong":"홍콩","Hungary":"헝가리","Iceland":"아이슬란드","India":"인도","Indonesia":"인도네시아","Iran":"이란","Iraq":"이라크","Ireland":"아일랜드","Israel":"이스라엘","Italy":"이탈리아","Jamaica":"자메이카","Japan":"일본","Jordan":"요르단","Kazakhstan":"카자흐스탄","Kenya":"케냐","Kiribati":"키리바시","Kosovo":"코소보","Kuwait":"쿠웨이트","Kyrgyzstan":"키르기스스탄","Laos":"라오스","Latvia":"라트비아","Lebanon":"레바논","Lesotho":"레소토","Liberia":"라이베리아","Libya":"리비아","Liechtenstein":"리히텐슈타인","Lithuania":"리투아니아","Luxembourg":"룩셈부르크","Macao":"마카오","Macedonia":"북마케도니아","Madagascar":"마다가스카르","Malawi":"말라위","Malaysia":"말레이시아","Maldives":"몰디브","Mali":"말리","Malta":"몰타","Marshall Is.":"마셜제도","Mauritania":"모리타니","Mauritius":"모리셔스","Mexico":"멕시코","Micronesia":"미크로네시아","Moldova":"몰도바","Monaco":"모나코","Mongolia":"몽골","Montenegro":"몬테네그로","Morocco":"모로코","Mozambique":"모잠비크","Myanmar":"미얀마","Namibia":"나미비아","Nauru":"나우루","Nepal":"네팔","Netherlands":"네덜란드","New Caledonia":"뉴칼레도니아","New Zealand":"뉴질랜드","Nicaragua":"니카라과","Niger":"니제르","Nigeria":"나이지리아","North Korea":"북한","Norway":"노르웨이","Oman":"오만","Pakistan":"파키스탄","Palau":"팔라우","Palestine":"팔레스타인","Panama":"파나마","Papua New Guinea":"파푸아뉴기니","Paraguay":"파라과이","Peru":"페루","Philippines":"필리핀","Poland":"폴란드","Portugal":"포르투갈","Puerto Rico":"푸에르토리코","Qatar":"카타르","Romania":"루마니아","Russia":"러시아","Rwanda":"르완다","S. Sudan":"남수단","Saint Lucia":"세인트루시아","Samoa":"사모아","San Marino":"산마리노","Saudi Arabia":"사우디아라비아","Senegal":"세네갈","Serbia":"세르비아","Seychelles":"세이셸","Sierra Leone":"시에라리온","Singapore":"싱가포르","Slovakia":"슬로바키아","Slovenia":"슬로베니아","Solomon Is.":"솔로몬제도","Somalia":"소말리아","South Africa":"남아프리카공화국","South Korea":"한국","Spain":"스페인","Sri Lanka":"스리랑카","St. Kitts and Nevis":"세인트키츠 네비스","St. Vin. and Gren.":"세인트빈센트 그레나딘","Sudan":"수단","Suriname":"수리남","Sweden":"스웨덴","Switzerland":"스위스","Syria":"시리아","São Tomé and Principe":"상투메 프린시페","Taiwan":"대만","Tajikistan":"타지키스탄","Tanzania":"탄자니아","Thailand":"태국","Timor-Leste":"동티모르","Togo":"토고","Tonga":"통가","Trinidad and Tobago":"트리니다드 토바고","Tunisia":"튀니지","Turkey":"튀르키예","Turkmenistan":"투르크메니스탄","Uganda":"우간다","Ukraine":"우크라이나","United Arab Emirates":"아랍에미리트","United Kingdom":"영국","United States of America":"미국","Uruguay":"우루과이","Uzbekistan":"우즈베키스탄","Vanuatu":"바누아투","Vatican":"바티칸","Venezuela":"베네수엘라","Vietnam":"베트남","W. Sahara":"서사하라","Yemen":"예멘","Zambia":"잠비아","Zimbabwe":"짐바브웨","eSwatini":"에스와티니","Falkland Is.":"포클랜드제도","Fr. Polynesia":"프랑스령 폴리네시아"};
const ALIAS = {"한국":"대한민국|남한","북한":"조선민주주의인민공화국","미국":"미합중국","영국":"","튀르키예":"터키","남아프리카공화국":"남아공","콩고민주공화국":"민주콩고","아랍에미리트":"UAE","사우디아라비아":"사우디","북마케도니아":"마케도니아","호주":"오스트레일리아","팔레스타인":"가자지구|요르단강서안"};
const w = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-50m.json','utf8'));
for (const f of feature(w, w.objects.countries).features){
  const ko = KO[f.properties.name]; if (!ko) continue;
  let [lat,lng] = mainCentroid(f.geometry);
  if (ko==='한국'){ lat = 36.5; lng = 127.8; } // 섬 없이 본토 가운데
  add(ko, '나라', lat, lng, ALIAS[ko]||'');
}

// ── 2. 대륙·지역·바다·극지 (대표 위치)
const WORLD = [
 ['아시아',34,100,'대륙'],['유럽',50,15,'대륙'],['아프리카',2,20,'대륙'],['북아메리카',45,-100,'대륙','북미'],['남아메리카',-15,-60,'대륙','남미'],['오세아니아',-22,140,'대륙'],
 ['남극',-80,0,'극지','남극대륙|남극점'],['북극',82,0,'극지','북극점|북극권'],
 ['동아시아',35,115,'지역'],['동남아시아',5,110,'지역'],['남아시아',22,79,'지역'],['중앙아시아',45,65,'지역'],['서아시아',29,45,'지역'],['중동',29,45,'지역'],
 ['서유럽',48,4,'지역'],['동유럽',50,30,'지역'],['북유럽',62,15,'지역','스칸디나비아'],['남유럽',42,13,'지역'],['발칸반도',43,21,'지역','발칸'],
 ['북아프리카',27,10,'지역'],['서아프리카',10,-3,'지역'],['동아프리카',0,37,'지역'],['남부 아프리카',-25,25,'지역'],['사헬',14,5,'지역'],['사하라사막',23,10,'지역','사하라'],
 ['중앙아메리카',14,-87,'지역','중미'],['라틴아메리카',-10,-60,'지역','중남미'],['카리브해',16,-72,'바다'],
 ['시베리아',62,105,'지역'],['티베트',31,88,'지역'],['히말라야',28,85,'지역'],['알프스',46.5,10,'지역'],['안데스',-15,-70,'지역'],['아마존',-4,-62,'지역'],['파타고니아',-45,-69,'지역'],['고비사막',43,105,'지역'],
 ['태평양',0,-160,'바다'],['대서양',25,-40,'바다'],['인도양',-15,80,'바다'],['북극해',84,-30,'바다'],['남극해',-62,0,'바다','남빙양'],
 ['지중해',35,18,'바다'],['홍해',20,38,'바다'],['흑해',43,35,'바다'],['카스피해',42,51,'바다'],['아랄해',45,60,'바다'],['발트해',58,20,'바다'],['북해',56,3,'바다'],
 ['남중국해',12,114,'바다'],['동중국해',29,125,'바다'],['오호츠크해',55,150,'바다'],['베링해',58,-178,'바다'],['아라비아해',15,65,'바다'],['벵골만',15,88,'바다'],['페르시아만',27,51,'바다','걸프'],['멕시코만',25,-90,'바다'],
 ['호르무즈해협',26.6,56.3,'바다'],['말라카해협',2.5,101.5,'바다'],['지브롤터해협',36,-5.6,'바다'],['보스포루스해협',41.1,29.05,'바다'],['대만해협',24.5,119.5,'바다'],
 ['수에즈운하',30.6,32.33,'운하'],['파나마운하',9.08,-79.68,'운하'],
];
for (const [n,lat,lng,k,a] of WORLD) add(n, k, lat, lng, a||'');

// ── 3. 우리나라 시도
const SIDO = [['서울','서울특별시'],['부산','부산광역시'],['대구','대구광역시'],['인천','인천광역시'],['광주','광주광역시'],['대전','대전광역시'],['울산','울산광역시'],['세종','세종특별자치시'],
  ['경기','경기도'],['강원','강원특별자치도|강원도'],['충북','충청북도'],['충남','충청남도'],['전북','전북특별자치도|전라북도'],['전남','전라남도'],['경북','경상북도'],['경남','경상남도'],['제주','제주특별자치도|제주도']];
const prov = JSON.parse(fs.readFileSync('/tmp/geo/prov.json','utf8')).features;
const provByName = {}; for (const f of prov) provByName[f.properties.name] = f;
const CITYHALL = {서울:[37.566,126.978],부산:[35.180,129.075],대구:[35.871,128.601],인천:[37.456,126.705],광주:[35.160,126.851],대전:[36.350,127.385],울산:[35.539,129.311],세종:[36.480,127.289]};
for (const [short, full] of SIDO){
  let lat, lng;
  if (CITYHALL[short]) [lat,lng] = CITYHALL[short];          // 광역시는 시청 자리(바다 섬 영향 없이)
  else { const f = provByName[full.split('|').pop()] || provByName[full.split('|')[0]]; if (!f) throw new Error('no prov '+full); [lat,lng] = mainCentroid(f.geometry); }
  add(short, '시도', lat, lng, full);
}

// ── 4. 시군 (도의 시·군 + 광역시의 군). 구가 있는 시는 구를 합침. 2014 청주·청원 통합 반영
const muni = JSON.parse(fs.readFileSync('/tmp/geo/muni.json','utf8')).features;
const group = new Map();
const SIDO_OF = {'21':'부산','22':'대구','23':'인천','26':'울산','31':'경기','32':'강원','33':'충북','34':'충남','35':'전북','36':'전남','37':'경북','38':'경남','39':'제주'};
for (const f of muni){
  const pre = f.properties.code.slice(0,2); let name = f.properties.name;
  if (!SIDO_OF[pre]) continue;
  if (+pre < 31 && !/군$/.test(name)) continue;            // 광역시는 군만
  name = name.replace(/^(.+시).+구$/, '$1');               // 수원시장안구 → 수원시
  if (name === '청원군') name = '청주시';
  if (name === '울릉군') continue;                          // 섬 '울릉도'로 따로 넣음
  const key = pre + ':' + name;
  if (!group.has(key)) group.set(key, {pre, name, feats:[]});
  group.get(key).feats.push(f);
}
const shortOf = n => n.replace(/(시|군)$/, '');
const counts = {}; for (const g of group.values()) counts[shortOf(g.name)] = (counts[shortOf(g.name)]||0) + 1;
const RESERVED = new Set(['광주','동해','남해','고성']);   // 시도·바다와 이름이 겹치는 것
for (const g of group.values()){
  const s = shortOf(g.name), sido = SIDO_OF[g.pre];
  let name = s, alias = g.name;
  if (counts[s] > 1 || RESERVED.has(s)){
    if (s==='동해') name = '동해시';
    else if (s==='남해') name = '남해군';
    else name = `${sido} ${s}`;
    alias = `${sido} ${g.name}`;
  }
  if (g.name==='군위군') alias = '군위군|대구 군위';
  const [lat,lng] = allCentroid(g.feats);
  add(name, '시군', lat, lng, alias);
}

// ── 5. 섬·산·하천·바다·북한 주요 도시 (대표 위치)
const KR = [
 ['울릉도',37.50,130.86,'섬','울릉|울릉군'],['독도',37.24,131.87,'섬'],['백령도',37.96,124.67,'섬'],['연평도',37.67,125.70,'섬'],['흑산도',34.68,125.43,'섬'],['마라도',33.12,126.27,'섬'],['거문도',34.03,127.31,'섬'],
 ['백두산',42.006,128.056,'산'],['한라산',33.362,126.533,'산'],['지리산',35.337,127.731,'산'],['설악산',38.119,128.465,'산'],['태백산',37.096,128.916,'산'],['소백산',36.957,128.484,'산'],['금강산',38.65,128.10,'산'],['북한산',37.66,126.98,'산'],['덕유산',35.86,127.75,'산'],['오대산',37.79,128.54,'산'],
 ['한강',37.53,126.98,'하천'],['낙동강',36.0,128.4,'하천'],['금강',36.4,127.2,'하천'],['영산강',35.0,126.7,'하천'],['섬진강',35.2,127.6,'하천'],['임진강',38.0,126.9,'하천'],['대동강',39.0,125.7,'하천'],['압록강',41.0,126.0,'하천'],['두만강',42.5,129.9,'하천'],
 ['동해',38.5,131.0,'바다'],['서해',36.0,124.6,'바다','황해'],['남해',34.0,127.8,'바다'],['대한해협',34.6,129.2,'바다'],
 ['평양',39.03,125.75,'북한 도시'],['개성',37.97,126.55,'북한 도시'],['신의주',40.10,124.40,'북한 도시'],['원산',39.15,127.44,'북한 도시'],['함흥',39.92,127.54,'북한 도시'],['청진',41.79,129.78,'북한 도시'],['나선',42.25,130.29,'북한 도시','라선'],['남포',38.73,125.40,'북한 도시'],['혜산',41.40,128.18,'북한 도시'],
 ['판문점',37.96,126.68,'장소'],['비무장지대',38.3,127.5,'장소','DMZ'],['새만금',35.8,126.6,'장소'],
];
for (const [n,lat,lng,k,a] of KR) add(n, k, lat, lng, a||'');

// ── 겹침 검사
const seen = new Map();
for (const r of rows){ for (const n of [r[0], ...String(r[4]).split('|').filter(Boolean)]){ if (seen.has(n) && seen.get(n)!==r[0]) console.warn('겹침:', n, seen.get(n), r[0]); seen.set(n, r[0]); } }
const csvEsc = v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g,'""')}"` : String(v);
fs.writeFileSync(OUT+'/places.csv', '﻿이름,종류,위도,경도,별칭\n' + rows.map(r=>r.map(csvEsc).join(',')).join('\n') + '\n');
fs.writeFileSync(OUT+'/places.json', JSON.stringify(rows));
const byKind = {}; for (const r of rows) byKind[r[1]] = (byKind[r[1]]||0)+1;
console.log('총', rows.length, JSON.stringify(byKind));
