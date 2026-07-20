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
import { ViewScaleMode } from "../libs/vanilla.js/src/core/viewmanager.js";
import { getSafeAreaInsetTop, getContentViewSize } from "./game/safearea.js";


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

		const viewManager = engine.getViewManager();
		viewManager.setViewScaleMode(ViewScaleMode.stretchHeight);
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
