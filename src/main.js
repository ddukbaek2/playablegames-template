//==============================================================================
// 포함 모듈 목록.
//==============================================================================
const System = globalThis;
import { Vector2 } from "../libs/vanilla.js/src/base/vector2.js";
import { Rect } from "../libs/vanilla.js/src/base/rect.js";
import { Colors } from "../libs/vanilla.js/src/base/colors.js";
import { Engine, EngineConfiguration } from "../libs/vanilla.js/src/core/engine.js";
import { Graphic } from "../libs/vanilla.js/src/core/graphic.js";
import { Scene } from "../libs/vanilla.js/src/core/scene.js";
import { getSafeAreaInsetTop, getContentViewSize } from "./game/safearea.js";
import { applyAspectViewScaleMode } from "./game/viewscale.js";
import { initializeAudioUnlock } from "./game/audio.js";


//==============================================================================
// 기본 씬.
//==============================================================================
class MainScene extends Scene {
	//==============================================================================
	// 초기화.
	//==============================================================================
	/**
	 * @param { Engine } engine
	 */
	initialize(engine) {
		super.initialize(engine);

		// 뷰 스케일 모드를 첫 프레임부터 종횡비에 맞게 적용한다. (자세한 사용법은 game/viewscale.js 참고)
		const viewManager = engine.getViewManager();
		applyAspectViewScaleMode(viewManager);

		// 오디오 제스처 정책: 네이티브 = 즉시 허용, 웹 = 첫 제스처에서 해제. (game/audio.js 참고)
		initializeAudioUnlock(engine);
	}

	//==============================================================================
	// 화면 크기 변경됨. (회전·창 크기 변화 시 종횡비 기반 모드 재적용)
	//==============================================================================
	/**
	 * @param { Vector2 } canvasNativeSize
	 */
	resize(canvasNativeSize) {
		super.resize(canvasNativeSize);

		const engine = this.getEngine();
		const viewManager = engine.getViewManager();
		applyAspectViewScaleMode(viewManager);
	}

	//==============================================================================
	// 출력.
	//==============================================================================
	/**
	 * @param { Graphic } graphic
	 */
	draw(graphic) {
		super.draw(graphic);

		const engine = this.getEngine();
		const canvasRenderingContext = graphic.getCanvasRenderingContext();
		const viewManager = engine.getViewManager();
		const canvasNativeSize = viewManager.getCanvasNativeSize();

		// 전체 화면 칠하기.
		viewManager.applyCanvasNativeRect(canvasRenderingContext);
		canvasRenderingContext.fillStyle = Colors.darkVanilla;
		graphic.drawRect(Rect.create(0, 0, canvasNativeSize.x, canvasNativeSize.y));

		// 게임 영역 칠하기. (안전영역 사용 예시 — 자세한 사용법은 game/safearea.js 참고)
		// 상단 안전영역만큼 콘텐츠를 아래로 이동하고, 이동을 제외한 콘텐츠 크기로 그린다.
		// 입력 처리 시에도 입력 좌표의 y 에서 상단 안전영역만큼 빼서 콘텐츠 좌표로 보정한다.
		viewManager.applyViewRect(canvasRenderingContext);
		const safeAreaInsetTop = getSafeAreaInsetTop(viewManager);
		const contentViewSize = getContentViewSize(viewManager);
		canvasRenderingContext.save();
		canvasRenderingContext.translate(0, safeAreaInsetTop);
		canvasRenderingContext.fillStyle = Colors.lightVanilla;
		graphic.drawRect(Rect.create(0, 0, contentViewSize.x, contentViewSize.y));
		canvasRenderingContext.restore();
	}
}


//==============================================================================
// 엔진 기동.
//==============================================================================
const engineConfiguration = new EngineConfiguration();
engineConfiguration.referenceResolutionSize = Vector2.create(800, 1280);
engineConfiguration.useStatistics = false;
const engine = new Engine(engineConfiguration);
document.title = "playablegames-template";
const scene = new MainScene();
engine.run(scene);
