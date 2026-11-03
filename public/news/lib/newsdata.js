/* 오늘도 지리는 소식: 데이터 정리 (사이트와 GitHub 자동 작업이 함께 씀)
 * - parseCSV: 구글 시트 CSV 읽기
 * - placeIndex: 지도 위치 목록(places.json) + 예전 좌표표(geo.js)로 지명 → 좌표
 * - parseArticles: 시트 줄 → 기사
 * - summarize: 그래프·지도에 쓰는 누적 요약 (기사 본문 없이 숫자만)
 */
(function (root) {
  "use strict";

  /* CSV (따옴표 안의 쉼표·줄바꿈 처리) → [{열이름: 값}] */
  function parseCSV(text) {
    text = String(text || "").replace(/^﻿/, "");
    const rows = []; let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += c;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    const head = (rows.shift() || []).map(h => h.trim());
    return rows.filter(r => r.some(v => v.trim() !== "")).map(r => {
      const o = {}; head.forEach((h, i) => { if (h) o[h] = r[i] ?? ""; }); return o;
    });
  }

  const splitTags = s => String(s || "").split(/[,，]/).map(t => t.replace(/^#/, "").trim()).filter(Boolean);
  function normDate(v) {
    const m = String(v || "").match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : "";
  }

  /* 한반도 지도에 찍을 범위 (독도 동경 131.87°까지) */
  const KOREA_BOX = { lat0: 33, lat1: 43, lng0: 124, lng1: 132.2 };
  const inKorea = p => !!p && p[0] >= KOREA_BOX.lat0 && p[0] <= KOREA_BOX.lat1 && p[1] >= KOREA_BOX.lng0 && p[1] <= KOREA_BOX.lng1;

  /* 지명 → {name(정식 이름), kind, at:[위도, 경도]}. 목록(이름·별칭) 먼저, 없으면 예전 좌표표 */
  function placeIndex(placeRows, geo) {
    const idx = new Map();
    for (const [name, kind, lat, lng, alias] of placeRows || []) {
      const v = { name, kind, at: [+lat, +lng] };
      idx.set(name, v);
      String(alias || "").split("|").filter(Boolean).forEach(a => { if (!idx.has(a)) idx.set(a, v); });
    }
    return {
      get(n) {
        if (idx.has(n)) return idx.get(n);
        if (geo && geo[n]) return { name: n, kind: "", at: geo[n] };
        return null;
      },
    };
  }

  /* 시트 줄 → 기사. 지도 위치는 '지도위치' 칸이 있으면 그것, 없으면 지역태그에서 찾음 */
  function parseArticles(rows, pidx) {
    return rows
      .filter(r => r && normDate(r.날짜) && (r.제목 || r.요약))
      .map((r, i) => {
        const regions = splitTags(r.지역태그), topics = splitTags(r.주제태그);
        const resolve = list => [...new Set(list.map(n => { const p = pidx && pidx.get(n); return p && p.name; }).filter(Boolean))];
        let places = resolve(splitTags(r.지도위치));
        if (!places.length) places = resolve(regions);
        return {
          id: i, date: normDate(r.날짜), cat: String(r.분야 || "").trim(),
          title: String(r.제목 || "").trim(), summary: String(r.요약 || "").trim(),
          regions, topics, places,
          q: String(r.질문 || r.생각해볼질문 || "").trim(),
          link: String(r.링크 || "").trim(), source: String(r.매체 || "").trim(),
        };
      });
  }

  /* 누적 요약: 처음부터 지금까지의 태그·지명 기사 수와 함께 나온 횟수 */
  function summarize(articles, pidx) {
    const tags = new Map(), tagPairs = new Map(), places = new Map(), placePairs = new Map();
    const dates = {}, cats = {}, months = new Set();
    let krArts = 0;
    const bump = (m, k, date) => { const v = m.get(k) || { c: 0, last: "" }; v.c++; if (date > v.last) v.last = date; m.set(k, v); };
    for (const a of articles) {
      dates[a.date] = (dates[a.date] || 0) + 1;
      if (a.cat) cats[a.cat] = (cats[a.cat] || 0) + 1;
      months.add(a.date.slice(0, 7));
      const ts = [...new Set(a.regions.map(t => "r:" + t).concat(a.topics.map(t => "t:" + t)))];
      ts.forEach(t => bump(tags, t, a.date));
      for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) {
        const k = ts[i] < ts[j] ? ts[i] + "|" + ts[j] : ts[j] + "|" + ts[i];
        tagPairs.set(k, (tagPairs.get(k) || 0) + 1);
      }
      a.places.forEach(p => bump(places, p, a.date));
      for (let i = 0; i < a.places.length; i++) for (let j = i + 1; j < a.places.length; j++) {
        const [x, y] = [a.places[i], a.places[j]].sort();
        placePairs.set(x + "|" + y, (placePairs.get(x + "|" + y) || 0) + 1);
      }
      if (pidx && a.places.some(p => { const v = pidx.get(p); return v && inKorea(v.at); })) krArts++;
    }
    const tagList = [...tags].sort((a, b) => b[1].c - a[1].c);
    const tagIdx = new Map(tagList.map(([k], i) => [k, i]));
    const placeList = [...places].sort((a, b) => b[1].c - a[1].c);
    const placeIdx = new Map(placeList.map(([k], i) => [k, i]));
    const dl = Object.keys(dates).sort().reverse();
    return {
      total: articles.length,
      latest: dl[0] || "",
      dates: dl.map(d => [d, dates[d]]),
      months: [...months].sort().reverse(),
      cats,
      krArts,
      tags: tagList.map(([k, v]) => [k.slice(2), k[0], v.c, v.last]),          // [이름, r|t, 기사 수, 마지막 날짜]
      tagPairs: [...tagPairs].map(([k, w]) => { const [a, b] = k.split("|"); return [tagIdx.get(a), tagIdx.get(b), w]; }),
      places: placeList.map(([k, v]) => [k, v.c, v.last]),                      // [정식 지명, 기사 수, 마지막 날짜]
      placePairs: [...placePairs].map(([k, w]) => { const [a, b] = k.split("|"); return [placeIdx.get(a), placeIdx.get(b), w]; }),
    };
  }

  const api = { parseCSV, splitTags, normDate, KOREA_BOX, inKorea, placeIndex, parseArticles, summarize };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NewsData = api;
})(typeof window !== "undefined" ? window : globalThis);
