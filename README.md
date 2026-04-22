# playablegames-template

바닐라 자바스크립트(`libs/vanilla.js` 서브모듈) 기반의 단일 플레이어블 게임 프로젝트 템플릿.

## 시작하기

```bash
# 서브모듈 포함 클론
git clone --recurse-submodules <repo-url>

# 의존성 설치
npm install

# 개발 서버: launcher.html 을 Live Server 로 연다
# (VS Code Launch: "Debug Local Live Server")

# 빌드 (build/web/ 에 정적 파일 생성)
npm run build

# 자산 현황 리포트
npm run check
```

## 구조

- `src/main.js` : 진입 파일. 엔진 기동 + `engine.run()` 까지 자체 수행
- `launcher.html` / `launcher.js` : 개발용 런처
- `assets/sprites` | `fonts` | `audio` | `data` : 자산 루트
- `libs/vanilla.js` : 경량 게임 프레임워크 서브모듈
- `build/web/` : 빌드 출력

자세한 빌드 흐름은 [MENUAL.md](./MENUAL.md) 참고.
