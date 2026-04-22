# 빌드 매뉴얼

본 템플릿은 단일 플레이어블 게임 프로젝트를 기준으로 하며, 동일한 게임 빌드물을 3가지 형태의 배포 결과물로 내보낸다.

| 타입 | 용도 | 출력 위치 |
|---|---|---|
| 기본 빌드 | nginx / Live Server 정적 서빙 | `build/web/` |
| 앱인토스 빌드 | Apps in Toss 업로드 패키지 (`.ait`) | `platforms/appintoss/` |
| 원스토어 빌드 | 원스토어 제출용 AAB / 테스트용 APK | `platforms/onestore/` |

앱인토스/원스토어 빌드는 **기본 빌드 결과물을 소스로 사용**한다. 따라서 항상 기본 빌드를 먼저 실행한 뒤 각 플랫폼 빌드를 수행해야 한다.


# 개발 서버 (Live Server)

`launcher.html` 을 Live Server 로 열면 `launcher.js` 가 `src/main.js` 를 동적 import 하여 실행한다.

- VS Code 디버그 구성: `Debug Local Live Server`
- 기본 URL: `http://127.0.0.1:6001/launcher.html`


# 기본 빌드

`src/main.js` 를 esbuild 엔트리로 번들링하고, `assets/` 전체와 `libs/vanilla.js/tools/buildtemplate` 을 `build/web/` 에 복사한다.

```bash
npm run build
```

내부적으로는 다음 명령을 호출한다.

```bash
node libs/vanilla.js/tools/project.cjs build --script src/main.js --input . --output build/web
```

VS Code Task: `Build`.

출력 구조:

```
build/web/
├── index.html          # libs/vanilla.js/tools/buildtemplate/index.html
├── favicon.ico
├── favicon.svg
├── css/
├── js/
│   └── bundle.min.js   # src/main.js 번들 결과
└── assets/             # 프로젝트 assets/ 전체 복사
```


# 자산 현황 체크

`assets/sprites/` 하위 이미지/아틀라스 현황을 리포트로 출력한다.

```bash
npm run check
```

VS Code Task: `Check Assets`.


# 앱인토스 빌드

`platforms/appintoss/` 에서 기본 빌드 결과물을 `public/` 으로 스테이징한 뒤, `granite dev` 로컬 서버를 띄우거나 `ait build` 로 `.ait` 패키지를 생성한다.

## 선결 조건

```bash
npm run build
```

또한 `platforms/appintoss/granite.config.ts` 의 `appName`, `displayName`, `icon` 값을 본인 앱에 맞게 수정해야 한다.

## 루트에서 실행

```bash
# 스테이징만 (build/web -> platforms/appintoss/public)
npm run stage:ait

# 스테이징 + 로컬 디버그 서버 (granite dev)
npm run dev:ait

# 스테이징 + .ait 패키지 생성 (ait build)
npm run build:ait
```

VS Code Task: `Packaging AIT` (기본 빌드 후 AIT 빌드까지 수행).
VS Code Launch: `Debug Local AIT Server`.


# 원스토어 빌드

`platforms/onestore/` 는 Capacitor 기반 안드로이드 래퍼 프로젝트다. 기본 빌드 결과물을 `www/` 로 스테이징하고, `cap sync` 로 안드로이드 프로젝트에 반영한 뒤 Gradle 로 AAB/APK 를 빌드한다.

## 선결 조건

```bash
npm run build
```

또한 다음이 준비되어 있어야 한다.

- `platforms/onestore/capacitor.config.json` 의 `appId`, `appName` 을 본인 앱에 맞게 수정.
- 안드로이드 프로젝트 생성: `platforms/onestore/` 에서 `npx cap add android`.
- 서명 키스토어: `android/app/` 아래에 keystore 파일 + `keystore.properties` 배치.

## 루트에서 실행

```bash
# 스테이징만 (build/web -> platforms/onestore/www)
npm run stage:onestore

# 스테이징 + Capacitor sync
npm run sync:onestore

# Android Studio 열기
npm run open:onestore

# AAB 빌드 (stage + cap sync + gradle bundleRelease)
npm run build:aab:onestore

# APK 빌드 (stage + cap sync + gradle assembleRelease)
npm run build:apk:onestore
```

VS Code Task: `Packaging Onestore AAB`, `Packaging Onestore APK`.

## 결과물

- AAB: `platforms/onestore/android/app/build/outputs/bundle/release/app-release.aab`
- APK: `platforms/onestore/android/app/build/outputs/apk/release/app-release.apk`


# 자산 구조

단일 프로젝트이므로 게임별 하위 폴더 없이 바로 자산을 배치한다.

```
assets/
├── sprites/    # 이미지, 아틀라스 JSON
├── fonts/      # .woff2 웹폰트
├── audio/      # .webm 웹오디오
└── data/       # JSON 등 기타 데이터
```


# 사전 조건

- Node.js 20+
- esbuild 전역 설치 (`npm install -g esbuild`)
- 자산 현황 체크(`npm run check`) 사용 시 `canvas` 패키지가 필요하며 `npm install` 로 설치된다.
- 앱인토스 빌드: `npm install --prefix platforms/appintoss`.
- 원스토어 빌드: `npm install --prefix platforms/onestore` + Android SDK + JDK 17+.
