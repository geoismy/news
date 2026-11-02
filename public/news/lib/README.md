# 함께 쓰는 도구 (외부 CDN 대신 이 폴더에서 불러옴)

- papaparse 5.4.1 (MIT) https://github.com/mholt/PapaParse
- force-graph 1.43.5 (MIT) https://github.com/vasturiano/force-graph

학교망 등에서 unpkg·cdnjs가 막혀도 그래프와 CSV 읽기가 되도록 저장소에 같이 둠.
- dotmap.json — 뉴스 지도용 점 지도. world-atlas(Natural Earth 공공 데이터, ISC)로 미리 만든 좌표
  - world: Natural Earth 투영, 1000 × 522, 점 간격 6
  - korea: 한반도 확대 지도(위도 33~42.6°, 경도 124.2~131°), 세 번째 값 1 = 남북한 땅
