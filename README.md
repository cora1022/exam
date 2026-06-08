# exam

과목별 문제를 풀고 결과를 확인할 수 있는 브라우저 기반 Smart Quiz 앱입니다.

## 프로젝트 목적

시험 기간에 빠르게 문제를 풀어보고 복습하기 위한 정적 퀴즈 도구입니다. 사용자는 과목을 선택하고 순차/랜덤 모드로 문제를 풀 수 있으며, 관리 화면에서는 문제 데이터를 다루는 구조를 제공합니다.

## 기술 스택

- HTML
- CSS
- Vanilla JavaScript
- localStorage

## 아키텍처

`index.html`이 사용자 퀴즈 화면이고 `assets/pages/admin.html`이 관리 화면입니다. 문제 원본은 `data.js`의 `quizData` 배열에서 읽고, 풀이 통계는 브라우저 `localStorage`에 저장합니다. 서버 없이 정적 파일만으로 실행됩니다.

## 폴더 구조

```text
.
├── assets/
│   ├── css/style.css
│   ├── js/
│   │   ├── admin.js
│   │   └── app.js
│   └── pages/admin.html
├── data.js
├── index.html
└── README.md
```

## 실행 방법

```bash
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 열면 사용자 화면을, `http://localhost:8000/assets/pages/admin.html`을 열면 관리 화면을 확인할 수 있습니다.
