// 구글 시트(발행본4) → 사이트용 데이터 파일
//   public/news/data/summary.json   누적 요약 (그래프·지도용, 기사 본문 없음)
//   public/news/data/recent.json    최근 30일 기사 (첫 화면 목록)
//   public/news/data/m/YYYY-MM.json 달별 기사 (지난 소식·아카이브에서 필요할 때만)
// 실행: node tools/build-data.js   (GitHub Actions가 30분마다 실행, 바뀐 게 있을 때만 올림)
"use strict";
const fs = require("fs");
const path = require("path");
const ND = require("../public/news/lib/newsdata.js");

const ROOT = path.join(__dirname, "..");
const PUB = path.join(ROOT, "public/news");
const OUT = path.join(PUB, "data");
const RECENT_DAYS = +process.env.RECENT_DAYS || 30;   // 시험할 때만 바꿈

// 시트 주소는 index.html 의 CSV_URL 한 곳에서만 관리
const html = fs.readFileSync(path.join(PUB, "index.html"), "utf8");
const CSV_URL = (html.match(/const CSV_URL = "([^"]+)"/) || [])[1];
if (!CSV_URL) { console.error("CSV_URL을 index.html에서 찾지 못했어요"); process.exit(1); }

// 예전 좌표표(geo.js)는 브라우저용이라 내용만 읽어 씀
const GEO = new Function(fs.readFileSync(path.join(PUB, "geo.js"), "utf8") + "\nreturn GEO;")();
const PLACES = JSON.parse(fs.readFileSync(path.join(PUB, "places.json"), "utf8"));

const writeJSON = (file, obj) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj));
};

(async () => {
  let text;
  if (process.env.CSV_FILE) text = fs.readFileSync(process.env.CSV_FILE, "utf8");   // 시험용
  else {
    const res = await fetch(CSV_URL, { headers: { "cache-control": "no-cache" } });
    if (!res.ok) throw new Error("시트를 받지 못했어요: HTTP " + res.status);
    text = await res.text();
  }
  const rows = ND.parseCSV(text);
  const pidx = ND.placeIndex(PLACES, GEO);
  const all = ND.parseArticles(rows, pidx);
  if (!all.length) throw new Error("기사가 0건이에요. 시트가 비었거나 열 이름이 바뀌었는지 확인해 주세요.");

  const summary = ND.summarize(all, pidx);
  const strip = a => ({ ...a });            // 기사 모양 그대로
  const latest = summary.latest;
  const from = new Date(Date.parse(latest + "T00:00:00Z") - (RECENT_DAYS - 1) * 864e5).toISOString().slice(0, 10);
  const recent = all.filter(a => a.date >= from).map(strip);

  // 지도에 못 찍은 지명 (지도위치·지역태그 둘 다 목록에 없음) → 사이트에 알림용
  const missing = new Map();
  for (const r of rows) for (const n of ND.splitTags(r.지도위치 || "")) if (!pidx.get(n)) missing.set(n, (missing.get(n) || 0) + 1);
  summary.missingPlaces = [...missing].sort((a, b) => b[1] - a[1]).slice(0, 50);
  summary.recentFrom = from;

  // 달별 파일: 지난 내용을 지운 뒤 다시 씀
  fs.rmSync(path.join(OUT, "m"), { recursive: true, force: true });
  const byMonth = new Map();
  for (const a of all) { const m = a.date.slice(0, 7); if (!byMonth.has(m)) byMonth.set(m, []); byMonth.get(m).push(strip(a)); }
  for (const [m, list] of byMonth) writeJSON(path.join(OUT, "m", m + ".json"), list);
  writeJSON(path.join(OUT, "recent.json"), recent);
  writeJSON(path.join(OUT, "summary.json"), summary);

  const kb = f => (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(1) + "KB";
  console.log(`기사 ${all.length}건 · 최근 ${recent.length}건(${from}~) · 달 ${byMonth.size}개 · 태그 ${summary.tags.length}개 · 지명 ${summary.places.length}곳`);
  console.log(`summary ${kb("summary.json")} · recent ${kb("recent.json")}`);
  if (summary.missingPlaces.length) console.log("목록에 없는 지도위치:", summary.missingPlaces.map(([n, c]) => `${n}(${c})`).join(", "));
})().catch(e => { console.error(e.message || e); process.exit(1); });
