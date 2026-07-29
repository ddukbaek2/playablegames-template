//==============================================================================
// 포함 모듈 목록.
//==============================================================================
const System = globalThis;
import { Capacitor } from "@capacitor/core";


//==============================================================================
// 오디오 제스처 정책 재사용 유틸.
//
// 웹 브라우저는 사용자 제스처(터치/키) 이전의 AudioContext 재생을 차단한다.
// 반면 네이티브(Capacitor) 빌드는 제스처 없이도 즉시 소리가 나야 한다.
// 이 유틸이 그 분기를 감싼다: 네이티브 = 즉시 허용, 웹 = 첫 제스처에서 자동 해제.
//
// 권장 사용 패턴.
//   1. 씬 load() 초기에 initializeAudioUnlock(engine) 을 호출한다.
//   2. 소리를 내기 전 isAudioUnlocked() 로 확인한다. (해제 전이면 재생 생략)
//==============================================================================


//==============================================================================
// 해제 상태.
//==============================================================================
let audioUnlocked = false;


//==============================================================================
// 오디오 해제 초기화. (네이티브 = 즉시 해제, 웹 = 첫 제스처에서 해제 + 컨텍스트 재개)
//==============================================================================
/**
 * @param { object } engine
 */
export function initializeAudioUnlock(engine) {
	const isNativePlatform = Capacitor.isNativePlatform();
	audioUnlocked = isNativePlatform;
	if (audioUnlocked) {
		return;
	}
	const handleFirstUserGesture = () => {
		audioUnlocked = true;
		const audioManager = engine.getAudioManager();
		audioManager.resumeContext();
	};
	System.window.addEventListener("pointerdown", handleFirstUserGesture, { once: true });
	System.window.addEventListener("keydown", handleFirstUserGesture, { once: true });
}


//==============================================================================
// 오디오 재생 가능 여부 반환.
//==============================================================================
/**
 * @returns { boolean }
 */
export function isAudioUnlocked() {
	return audioUnlocked;
}
