//==============================================================================
// 포함 모듈 목록.
//==============================================================================
import { ViewScaleMode } from "../../libs/vanilla.js/src/core/viewmanager.js";


//==============================================================================
// 종횡비 기반 뷰 스케일 모드 재사용 유틸.
//
// 판정 기준은 화면의 세로/가로 방향이 아니라 "기준 해상도 대비 어느 축이 부족한가"이다.
// 기준 해상도로 디자인한 콘텐츠가 항상 온전히 보이도록 부족한 축을 맞추고, 남는 축만 확장한다.
//   - 화면 종횡비 < 기준 종횡비 (화면이 기준보다 좁고 김) → 가로 맞춤·세로 확장(stretchWidthExpandHeight)
//   - 화면 종횡비 > 기준 종횡비 (화면이 기준보다 넓음)   → 세로 맞춤·가로 확장(stretchHeightExpandWidth)
// 따라서 기준 해상도가 세로형(예: 800×1280)이든 가로형(예: 1280×800)이든 그대로 쓸 수 있다.
// (기준 해상도는 EngineConfiguration.referenceResolutionSize 로 지정 — 가로 게임이면 가로형 값을 넣는다.)
//
// ⚠️ 반드시 씬 load() "진입 직후"에 한 번 호출할 것. 로드 완료 후에야 적용하면
// 로딩 화면이 기본 모드로 그려졌다가 전환 순간 크기가 변하는 문제가 생긴다.
// (pipemania 에서 가로형 화면의 로딩바가 커졌다 줄어들던 실사례)
//
// 권장 사용 패턴.
//   1. 씬 initialize 또는 load() 첫 줄: applyAspectViewScaleMode(viewManager)
//   2. 씬 resize / computeLayout: 다시 호출해 회전·창 크기 변화에 대응한다.
//   3. 방향 고정 앱(가로 전용 등)은 플랫폼 설정(AndroidManifest screenOrientation,
//      iOS 오리엔테이션 마스크)으로 방향을 잠그고, 이 유틸은 그 방향 안에서 모드를 고른다.
//==============================================================================


//==============================================================================
// 종횡비에 따라 뷰 스케일 모드 적용.
//==============================================================================
/**
 * @param { object } viewManager
 */
export function applyAspectViewScaleMode(viewManager) {
	const canvasNativeSize = viewManager.getCanvasNativeSize();
	if (canvasNativeSize.y <= 0) {
		return;
	}
	const referenceResolutionSize = viewManager.getReferenceResolutionSize();
	const designAspectRatio = referenceResolutionSize.x / referenceResolutionSize.y;
	const canvasAspectRatio = canvasNativeSize.x / canvasNativeSize.y;
	let viewScaleMode = ViewScaleMode.stretchWidthExpandHeight;
	if (canvasAspectRatio > designAspectRatio) {
		viewScaleMode = ViewScaleMode.stretchHeightExpandWidth;
	}
	viewManager.setViewScaleMode(viewScaleMode);
}
