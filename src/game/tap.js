//==============================================================================
// 포함 모듈 목록.
//==============================================================================
const System = globalThis;


//==============================================================================
// 탭 판정 재사용 유틸.
//
// touchPress/touchRelease 를 화면마다 직접 매칭하면 판정 기준이 화면마다 흔들린다.
// 이 트래커에 입력을 위임하면 "누른 위치에서 임계 이하로 움직이고 뗌 = 탭"을 일관되게 판정한다.
//
// 권장 사용 패턴.
//   1. 화면 클래스가 트래커 인스턴스를 하나 보유한다.
//   2. touchPress / touchMove 에 입력 좌표를 위임한다.
//   3. touchRelease(위치) 반환값이 참이면 탭 — 그 위치로 버튼 rect 판정을 수행한다.
//==============================================================================


//==============================================================================
// 탭으로 판정할 최대 이동량.
//==============================================================================
const TAP_MOVE_THRESHOLD = 12;


//==============================================================================
// 탭 트래커.
//==============================================================================
export class TapTracker {
	//==============================================================================
	// 멤버 변수 목록.
	//==============================================================================
	/** @private @type { boolean } */ #isPressed;
	/** @private @type { boolean } */ #moved;
	/** @private @type { number } */ #pressX;
	/** @private @type { number } */ #pressY;

	//==============================================================================
	// 생성.
	//==============================================================================
	constructor() {
		this.#isPressed = false;
		this.#moved = false;
		this.#pressX = 0;
		this.#pressY = 0;
	}

	//==============================================================================
	// 누름 상태 여부 반환. (버튼 눌림 표현 등에 사용)
	//==============================================================================
	/**
	 * @returns { boolean }
	 */
	getIsPressed() {
		return this.#isPressed;
	}

	//==============================================================================
	// 터치 누름.
	//==============================================================================
	/**
	 * @param { object } viewInputPosition
	 */
	touchPress(viewInputPosition) {
		this.#isPressed = true;
		this.#moved = false;
		this.#pressX = viewInputPosition.x;
		this.#pressY = viewInputPosition.y;
	}

	//==============================================================================
	// 터치 이동.
	//==============================================================================
	/**
	 * @param { object } viewInputPosition
	 */
	touchMove(viewInputPosition) {
		if (!this.#isPressed) {
			return;
		}
		const deltaX = viewInputPosition.x - this.#pressX;
		const deltaY = viewInputPosition.y - this.#pressY;
		const movedDistance = System.Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		if (movedDistance > TAP_MOVE_THRESHOLD) {
			this.#moved = true;
		}
	}

	//==============================================================================
	// 터치 뗌. 탭 여부를 돌려준다.
	//==============================================================================
	/**
	 * @param { object } viewInputPosition
	 * @returns { boolean }
	 */
	touchRelease(viewInputPosition) {
		const wasPressed = this.#isPressed;
		const wasMoved = this.#moved;
		this.#isPressed = false;
		this.#moved = false;
		const isTap = wasPressed && !wasMoved;
		return isTap;
	}
}
