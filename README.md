# 오늘도 지리는 소식 · geois.my/news

매일 아침 n8n이 모은 지리 소식을 보여 주는 페이지예요.

## 구조

```
n8n → 구글 시트(발행본4 탭) → 웹에 게시한 CSV → public/news/index.html이 읽어서 표시
```

- 기사를 올리거나 고칠 때는 **구글 시트만** 바꾸면 돼요. 이 저장소는 디자인을 고칠 때만 바뀌어요.
- CSV 주소와 카톡방 주소는 `public/news/index.html` 안의 `CSV_URL`, `KAKAO_URL`에 있어요.
- CSV를 못 읽으면 샘플 데이터로 대신 보여 주고, 위쪽에 안내가 떠요.

## 배포

- Cloudflare Workers 서비스 이름: `geois-news`
- `main`에 올리면 Cloudflare가 자동으로 배포해요.
- 주소 연결: `geois.my/news*` → 이 서비스 (`wrangler.toml`의 `routes`)
- 나머지 geois.my 주소는 `geoismy/way`(geois-way)가 받아요. way 쪽에서 `news`로 시작하는 짧은 주소는 예약어로 막혀 있어요.

## 첫 화면 AI 김정호

- 평소 말풍선: "오늘도 지리지리한 하루 보내시오! 🙃" (`index.html`의 `KIM_DEFAULT`)
- 특별한 날: 구글 시트에 **김정호** 탭(칸: 시작일 | 종료일 | 말 | 그림)을 만들고 웹에 게시(CSV)한 주소를 `KIM_URL`에 넣으면 시트만 고쳐서 바꿀 수 있어요.
  - 사이트는 구글 시트를 직접 읽지 않아요. GitHub 작업(소식 데이터 만들기)이 30분마다 이 탭을 `public/news/data/kim.json`으로 옮기고, 사이트는 그 파일만 읽어요. 시트를 고치면 최대 30분 뒤 반영돼요(급하면 Actions → Run workflow).
  - `10-09`는 해마다, `2026-11-02`는 그해만. 종료일을 비우면 그날 하루.
  - 그림은 `public/news/kim/` 에 파일을 넣고 이름만 적기 (비우면 기본 그림)
- 김정호 그림을 누르면 카톡방 인사말 편지가 열려요.

## 데이터 파일 (기사가 쌓여도 빠르게)

GitHub Actions(`.github/workflows/data.yml`)가 30분마다 시트를 읽어 파일을 만들어요. 바뀐 게 있을 때만 올리고, Cloudflare가 자동으로 배포해요.

| 파일 | 내용 | 쓰는 곳 |
| --- | --- | --- |
| `public/news/data/summary.json` | 처음부터 지금까지 태그·지명별 기사 수, 함께 나온 횟수 (기사 본문 없음) | 그래프 뷰, 뉴스 지도(전체), 첫 화면 숫자 |
| `public/news/data/recent.json` | 최근 30일 기사 | 첫 화면 목록, 지도 7일·오늘 |
| `public/news/data/m/YYYY-MM.json` | 달별 기사 | 지난 날짜, 아카이브, 태그 모아보기 |

- 바로 만들고 싶으면: GitHub → Actions → "소식 데이터 만들기" → Run workflow
- n8n에서 발행 직후 부르기: `POST https://api.github.com/repos/geoismy/news/dispatches` 본문 `{"event_type":"news-updated"}` (repo 권한 토큰 필요)
- 파일이 없거나 못 읽으면 사이트가 예전처럼 시트를 직접 읽어요.
- 시험: `CSV_FILE=시험.csv node tools/build-data.js`

## 지도 위치 목록 (`public/news/places.csv`)

지도에 찍을 수 있는 곳 약 485곳: 나라, 대륙·지역·바다·극지, 시도, 시군(광역시의 군 포함), 울릉도·독도 등 섬, 주요 산·하천·바다, 북한 주요 도시.

- 시트에 **지도위치** 칸을 두고 이 목록의 이름(또는 별칭)만 쓰면 그 자리에 찍혀요. 여러 곳은 쉼표로.
- 지도위치가 비어 있으면 지역태그에서 목록에 있는 이름을 찾아 찍어요(예전 좌표표 `geo.js`도 함께 봐요).
- 같은 이름은 구분해 두었어요: `광주`(광역시) / `경기 광주`, `강원 고성` / `경남 고성`, `동해시`(바다 `동해`와 구분), `남해군`(바다 `남해`와 구분)
- 목록을 다시 만들기: `tools/gen-places.mjs` (나라 중심은 world-atlas, 시군 중심은 southkorea-maps 2013 경계 + 청주·청원 통합 반영)
