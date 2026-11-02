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
  - `10-09`는 해마다, `2026-11-02`는 그해만. 종료일을 비우면 그날 하루.
  - 그림은 `public/news/kim/` 에 파일을 넣고 이름만 적기 (비우면 기본 그림)
- 김정호 그림을 누르면 카톡방 인사말 편지가 열려요.
