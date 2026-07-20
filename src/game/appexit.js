//==============================================================================
// 포함 모듈 목록.
//==============================================================================
const System = globalThis;
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";


//==============================================================================
// 앱 종료. (네이티브 = Capacitor App.exitApp, 웹 = window.close 시도)
// window.close 는 Capacitor 앱에서 동작하지 않으므로 네이티브에서는 App 플러그인을 사용한다.
//==============================================================================
export function exitApp() {
	const isNativePlatform = Capacitor.isNativePlatform();
	if (isNativePlatform) {
		try {
			App.exitApp();
		}
		catch (error) {
			console.error(error);
		}
		return;
	}
	try {
		System.window.close();
	}
	catch (error) {
		console.error(error);
	}
}
