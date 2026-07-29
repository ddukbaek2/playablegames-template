//==============================================================================
// 포함 모듈 목록.
//==============================================================================
import { ViewScaleMode } from "../../libs/vanilla.js/src/core/viewmanager.js";


//==============================================================================
// 종횡비 기반 뷰 스케일 모드 재사용 유틸.
//
// 세로가 충분히 긴 화면은 가로 맞춤(stretchWidthExpandHeight)으로 두고,
// 태블릿·데스크톱처럼 종횡비가 기준 해상도 이상인 화면에서는 가로 맞춤 시
// 세로 콘텐츠가 화면 높이를 넘어 겹치므로 세로 맞춤(stretchHeightExpandWidth)으로 전환한다.
//
// ⚠️ 반드시 씬 load() "진입 직후"에 한 번 호출할 것. 로드 완료 후에야 적용하면
// 로딩 화면이 기본 모드로 그려졌다가 전환 순간 크기가 변하는 문제가 생긴다.
// (pipemania 에서 가로형 화면의 로딩바가 커졌다 줄어들던 실사례)
//
// 권장 사용 패턴.
//   1. 씬 initialize 또는 load() 첫 줄: applyAspectViewScaleMode(viewManager)
//   2. 씬 resize / computeLayout: 다시 호출해 회전·창 크기 변화에 대응한다.
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
