//==============================================================================
// 포함 모듈 목록.
//==============================================================================
const System = globalThis;
import { Capacitor } from "@capacitor/core";
import { Vector2 } from "../../libs/vanilla.js/src/base/vector2.js";


//==============================================================================
// 안전영역(safe-area) 재사용 유틸.
//
// Android 15(targetSDK 35)의 edge-to-edge 는 웹뷰를 상태바/네비게이션바 뒤까지
// 그리므로, 상단/하단 시스템 영역과 게임 콘텐츠가 겹친다. 이를 막기 위해 CSS 의
// env(safe-area-inset-*) 값을 읽어 게임 콘텐츠를 그만큼 예약한다.
// (env() 가 유효하려면 웹 빌드 index 의 viewport 메타에 viewport-fit=cover 가 있어야 한다.)
//
// 권장 사용 패턴.
//   1. 레이아웃: 콘텐츠 크기는 getContentViewSize(viewManager) 로 구해 상단 안전영역을 제외한다.
//   2. 출력(draw): 상단 안전영역만큼 canvasRenderingContext.translate(0, insetTop) 후 콘텐츠를 그린다.
//   3. 입력(touch): 입력 좌표의 y 에서 상단 안전영역만큼 빼서 콘텐츠 좌표로 보정한다.
//   4. 하단 고정 UI: getSafeAreaInsetBottom(viewManager) 만큼 위로 올려 겹침을 막는다.
//==============================================================================


//==============================================================================
// 상단 안전영역(상태바/노치 등) 크기를 CSS 픽셀로 반환.
// env(safe-area-inset-top) 을 프로브 엘리먼트(fixed div)로 측정하며, 값을 못 얻는
// 네이티브(Capacitor) 환경에서는 상태바 대략값으로 대체한다.
//==============================================================================
/**
 * @returns { number }
 */
export function readSafeAreaInsetTopCssPixels() {
	const probeElement = System.document.createElement("div");
	probeElement.style.position = "fixed";
	probeElement.style.left = "0";
	probeElement.style.top = "0";
	probeElement.style.width = "0";
	probeElement.style.height = "env(safe-area-inset-top, 0px)";
	probeElement.style.visibility = "hidden";
	probeElement.style.pointerEvents = "none";
	System.document.body.appendChild(probeElement);
	const probeRect = probeElement.getBoundingClientRect();
	const measuredCssPixels = probeRect.height;
	System.document.body.removeChild(probeElement);
	if (measuredCssPixels > 0) {
		return measuredCssPixels;
	}
	const isNativePlatform = Capacitor.isNativePlatform();
	if (isNativePlatform) {
		return 28;
	}
	return 0;
}


//==============================================================================
// 하단 안전영역(홈 인디케이터 등) 크기를 CSS 픽셀로 반환.
// env(safe-area-inset-bottom) 을 프로브 엘리먼트(fixed div)로 측정하며, 값을 못 얻는
// 네이티브(Capacitor) 환경에서는 홈 인디케이터 대략값으로 대체한다.
//==============================================================================
/**
 * @returns { number }
 */
export function readSafeAreaInsetBottomCssPixels() {
	const probeElement = System.document.createElement("div");
	probeElement.style.position = "fixed";
	probeElement.style.left = "0";
	probeElement.style.bottom = "0";
	probeElement.style.width = "0";
	probeElement.style.height = "env(safe-area-inset-bottom, 0px)";
	probeElement.style.visibility = "hidden";
	probeElement.style.pointerEvents = "none";
	System.document.body.appendChild(probeElement);
	const probeRect = probeElement.getBoundingClientRect();
	const measuredCssPixels = probeRect.height;
	System.document.body.removeChild(probeElement);
	if (measuredCssPixels > 0) {
		return measuredCssPixels;
	}
	const isNativePlatform = Capacitor.isNativePlatform();
	if (isNativePlatform) {
		return 34;
	}
	return 0;
}


//==============================================================================
// 상단 안전영역 크기를 뷰 좌표 단위로 반환. (상단 콘텐츠가 상태바에 가리지 않도록)
// 상단 오프셋은 네이티브(Capacitor)에서만 적용한다. 웹 브라우저는 브라우저가 상단
// 노치/상태바를 이미 처리하므로, 오프셋을 넣으면 상단에 불필요한 검은 여백이 생긴다.
//==============================================================================
/**
 * @param { object } viewManager
 * @returns { number }
 */
export function getSafeAreaInsetTop(viewManager) {
	const isNativePlatform = Capacitor.isNativePlatform();
	if (!isNativePlatform) {
		return 0;
	}
	const canvasNativeSize = viewManager.getCanvasNativeSize();
	const viewSize = viewManager.getViewSize();
	if (canvasNativeSize.y <= 0) {
		return 0;
	}
	const insetCssPixels = readSafeAreaInsetTopCssPixels();
	const insetViewUnits = insetCssPixels * (viewSize.y / canvasNativeSize.y);
	return insetViewUnits;
}


//==============================================================================
// 하단 안전영역 크기를 뷰 좌표 단위로 반환. (하단 고정 UI 겹침 방지)
// 하단 인셋은 웹/네이티브 모두 유효하다.
//==============================================================================
/**
 * @param { object } viewManager
 * @returns { number }
 */
export function getSafeAreaInsetBottom(viewManager) {
	const canvasNativeSize = viewManager.getCanvasNativeSize();
	const viewSize = viewManager.getViewSize();
	if (canvasNativeSize.y <= 0) {
		return 0;
	}
	const insetCssPixels = readSafeAreaInsetBottomCssPixels();
	const insetViewUnits = insetCssPixels * (viewSize.y / canvasNativeSize.y);
	return insetViewUnits;
}


//==============================================================================
// 상단 안전영역을 제외한 콘텐츠 뷰 크기를 반환.
// 각 화면은 이 크기를 기준으로 레이아웃/출력하며, 전역 출력 시 상단 안전영역만큼 아래로 이동한다.
//==============================================================================
/**
 * @param { object } viewManager
 * @returns { Vector2 }
 */
export function getContentViewSize(viewManager) {
	const viewSize = viewManager.getViewSize();
	const safeAreaInsetTop = getSafeAreaInsetTop(viewManager);
	const contentViewSize = Vector2.create(viewSize.x, viewSize.y - safeAreaInsetTop);
	return contentViewSize;
}
