//==============================================================================
// 포함 모듈 목록.
//==============================================================================
const System = globalThis;


//==============================================================================
// 스크롤 뷰 재사용 유틸. (세로 탄성 스크롤 / 가로 스냅 페이지)
//
// 캔버스 게임의 화면 클래스가 상태만 위임해 쓰는 헤드리스 컴포넌트다. (그리기는 화면이 담당)
//
// 권장 사용 패턴 — VerticalScrollView (세로 목록/카드).
//   1. computeLayout 에서 setViewportRect / setContentHeight 를 갱신한다.
//   2. touchPress / touchMove / touchRelease 에 입력 좌표를 그대로 위임한다.
//      touchRelease 가 { isTap, contentPoint } 를 돌려주면 탭 — contentPoint(콘텐츠 좌표)로 버튼 판정.
//   3. tick(timeDelta) 을 매 프레임 호출한다. (러버밴딩·관성·스프링 복귀)
//   4. draw 에서 뷰포트로 클립한 뒤 getScrollOffset() 만큼 이동해 콘텐츠를 그린다.
//
// 권장 사용 패턴 — SnapPageView (튜토리얼식 가로 페이지).
//   1. setPageCount / setPageWidth 를 레이아웃 때 갱신한다.
//   2. touchPress / touchMove / touchRelease 에 입력 x 를 위임한다. release 반환값이 참이면 탭.
//   3. tick(timeDelta) 호출, draw 에서 getScrollX() 만큼 이동해 페이지들을 그린다.
//==============================================================================


//==============================================================================
// 스크롤 드래그로 판정할 최소 이동량. (이하 움직임은 탭)
//==============================================================================
const SCROLL_DRAG_THRESHOLD = 12;


//==============================================================================
// 세로 탄성 스크롤 뷰. (경계 러버밴딩 + 관성 + 스프링 복귀)
//==============================================================================
export class VerticalScrollView {
	//==============================================================================
	// 멤버 변수 목록.
	//==============================================================================
	/** @private @type { object } */ #viewportRect;
	/** @private @type { number } */ #contentHeight;
	/** @private @type { number } */ #scrollOffset;
	/** @private @type { number } */ #scrollVelocity;
	/** @private @type { number } */ #pointerStartY;
	/** @private @type { number } */ #currentPointerY;
	/** @private @type { number } */ #previousPointerY;
	/** @private @type { number } */ #pointerStartOffset;
	/** @private @type { boolean } */ #isDragging;
	/** @private @type { boolean } */ #pointerMoved;
	/** @private @type { boolean } */ #pointerInside;
	/** @private @type { number } */ #dragSpeedMultiplier;

	//==============================================================================
	// 생성.
	//==============================================================================
	constructor() {
		this.#viewportRect = { x: 0, y: 0, width: 0, height: 0 };
		this.#contentHeight = 0;
		this.#scrollOffset = 0;
		this.#scrollVelocity = 0;
		this.#pointerStartY = 0;
		this.#currentPointerY = 0;
		this.#previousPointerY = 0;
		this.#pointerStartOffset = 0;
		this.#isDragging = false;
		this.#pointerMoved = false;
		this.#pointerInside = false;
		this.#dragSpeedMultiplier = 1;
	}

	//==============================================================================
	// 뷰포트 영역 설정. (화면 좌표)
	//==============================================================================
	/**
	 * @param { object } rect
	 */
	setViewportRect(rect) {
		this.#viewportRect = rect;
	}

	//==============================================================================
	// 뷰포트 영역 반환.
	//==============================================================================
	/**
	 * @returns { object }
	 */
	getViewportRect() {
		return this.#viewportRect;
	}

	//==============================================================================
	// 콘텐츠 전체 높이 설정.
	//==============================================================================
	/**
	 * @param { number } contentHeight
	 */
	setContentHeight(contentHeight) {
		this.#contentHeight = contentHeight;
	}

	//==============================================================================
	// 드래그 반영 배율 설정. (1 = 손가락 이동량 그대로)
	//==============================================================================
	/**
	 * @param { number } dragSpeedMultiplier
	 */
	setDragSpeedMultiplier(dragSpeedMultiplier) {
		this.#dragSpeedMultiplier = dragSpeedMultiplier;
	}

	//==============================================================================
	// 스크롤 상태 초기화. (화면 진입 시)
	//==============================================================================
	reset() {
		this.#scrollOffset = 0;
		this.#scrollVelocity = 0;
		this.resetPointer();
	}

	//==============================================================================
	// 포인터 상태 초기화.
	//==============================================================================
	resetPointer() {
		this.#isDragging = false;
		this.#pointerMoved = false;
		this.#pointerInside = false;
	}

	//==============================================================================
	// 현재 스크롤 오프셋 반환. (콘텐츠를 이만큼 이동해 그린다 — 0 이하)
	//==============================================================================
	/**
	 * @returns { number }
	 */
	getScrollOffset() {
		return this.#scrollOffset;
	}

	//==============================================================================
	// 최소 스크롤 오프셋 반환. (콘텐츠가 뷰포트보다 짧으면 0 = 스크롤 없음)
	//==============================================================================
	/**
	 * @returns { number }
	 */
	getMinScrollOffset() {
		const minOffset = System.Math.min(0, this.#viewportRect.height - this.#contentHeight);
		return minOffset;
	}

	//==============================================================================
	// 화면 좌표 → 콘텐츠 좌표 변환.
	//==============================================================================
	/**
	 * @param { object } viewPoint
	 * @returns { object }
	 */
	toContentPoint(viewPoint) {
		const contentPoint = { x: viewPoint.x - this.#viewportRect.x, y: viewPoint.y - this.#viewportRect.y - this.#scrollOffset };
		return contentPoint;
	}

	//==============================================================================
	// 터치 누름.
	//==============================================================================
	/**
	 * @param { object } viewInputPosition
	 */
	touchPress(viewInputPosition) {
		const isInside = viewInputPosition.x >= this.#viewportRect.x && viewInputPosition.x <= this.#viewportRect.x + this.#viewportRect.width && viewInputPosition.y >= this.#viewportRect.y && viewInputPosition.y <= this.#viewportRect.y + this.#viewportRect.height;
		this.#pointerInside = isInside;
		if (!isInside) {
			return;
		}
		this.#isDragging = true;
		this.#pointerMoved = false;
		this.#pointerStartY = viewInputPosition.y;
		this.#currentPointerY = viewInputPosition.y;
		this.#previousPointerY = viewInputPosition.y;
		this.#pointerStartOffset = this.#scrollOffset;
		this.#scrollVelocity = 0;
	}

	//==============================================================================
	// 터치 이동.
	//==============================================================================
	/**
	 * @param { object } viewInputPosition
	 */
	touchMove(viewInputPosition) {
		if (!this.#isDragging) {
			return;
		}
		this.#currentPointerY = viewInputPosition.y;
		const movedDistance = System.Math.abs(viewInputPosition.y - this.#pointerStartY);
		if (movedDistance > SCROLL_DRAG_THRESHOLD) {
			this.#pointerMoved = true;
		}
	}

	//==============================================================================
	// 터치 뗌. 움직임이 작으면 탭으로 판정해 콘텐츠 좌표를 돌려준다.
	//==============================================================================
	/**
	 * @param { object } viewInputPosition
	 * @returns { object } 탭이면 { isTap: true, contentPoint }, 아니면 { isTap: false, contentPoint: null }.
	 */
	touchRelease(viewInputPosition) {
		const wasInside = this.#pointerInside;
		const wasMoved = this.#pointerMoved;
		this.#isDragging = false;
		this.#pointerInside = false;
		if (wasInside && !wasMoved) {
			const contentPoint = this.toContentPoint(viewInputPosition);
			return { isTap: true, contentPoint: contentPoint };
		}
		return { isTap: false, contentPoint: null };
	}

	//==============================================================================
	// 갱신. (탄성 스크롤 물리)
	//==============================================================================
	/**
	 * @param { number } timeDelta
	 */
	tick(timeDelta) {
		const minOffset = this.getMinScrollOffset();
		const maxOffset = 0;

		if (this.#isDragging) {
			// 드래그 중: 경계를 넘어가면 저항(러버밴딩)을 준다. (드래그 반영량은 배율 적용)
			const deltaY = (this.#currentPointerY - this.#pointerStartY) * this.#dragSpeedMultiplier;
			let proposedOffset = this.#pointerStartOffset + deltaY;
			const elasticResistance = 0.5;
			if (proposedOffset > maxOffset) {
				proposedOffset = maxOffset + (proposedOffset - maxOffset) * elasticResistance;
			}
			else if (proposedOffset < minOffset) {
				proposedOffset = minOffset + (proposedOffset - minOffset) * elasticResistance;
			}
			this.#scrollOffset = proposedOffset;

			// 놓았을 때의 관성용 속도 계산. (드래그 반영량과 같은 배율 적용)
			if (timeDelta > 0) {
				this.#scrollVelocity = (this.#currentPointerY - this.#previousPointerY) * this.#dragSpeedMultiplier / timeDelta;
			}
			this.#previousPointerY = this.#currentPointerY;
			return;
		}

		// 드래그 아님: 관성 감쇠 + 경계 밖이면 스프링으로 복귀.
		const springConstant = 1200;
		const dampingCoefficient = 30;
		const frictionCoefficient = 5;
		let velocity = this.#scrollVelocity;
		let offset = this.#scrollOffset;
		const clampedOffset = System.Math.min(System.Math.max(offset, minOffset), maxOffset);
		const displacement = offset - clampedOffset;
		if (displacement !== 0) {
			const springForce = -displacement * springConstant;
			const dampingForce = -velocity * dampingCoefficient;
			velocity = velocity + (springForce + dampingForce) * timeDelta;
		}
		else {
			velocity = velocity * System.Math.max(0, 1 - frictionCoefficient * timeDelta);
		}
		offset = offset + velocity * timeDelta;

		// 미세 진동 정리. (경계 안 + 저속이면 정지)
		const settledDisplacement = offset - System.Math.min(System.Math.max(offset, minOffset), maxOffset);
		if (System.Math.abs(velocity) < 1 && System.Math.abs(settledDisplacement) < 0.5) {
			velocity = 0;
			offset = System.Math.min(System.Math.max(offset, minOffset), maxOffset);
		}
		this.#scrollVelocity = velocity;
		this.#scrollOffset = offset;
	}
}


//==============================================================================
// 가로 스냅 페이지 뷰. (드래그로 넘기고 놓으면 가까운 페이지로 스냅)
//==============================================================================
export class SnapPageView {
	//==============================================================================
	// 멤버 변수 목록.
	//==============================================================================
	/** @private @type { number } */ #pageCount;
	/** @private @type { number } */ #pageWidth;
	/** @private @type { number } */ #currentPage;
	/** @private @type { number } */ #scrollX;
	/** @private @type { boolean } */ #isDragging;
	/** @private @type { boolean } */ #dragMoved;
	/** @private @type { number } */ #dragStartX;
	/** @private @type { number } */ #dragStartScrollX;
	/** @private @type { number } */ #pageTurnThreshold;
	/** @private @type { number } */ #dragSpeedMultiplier;

	//==============================================================================
	// 생성.
	//==============================================================================
	constructor() {
		this.#pageCount = 1;
		this.#pageWidth = 1;
		this.#currentPage = 0;
		this.#scrollX = 0;
		this.#isDragging = false;
		this.#dragMoved = false;
		this.#dragStartX = 0;
		this.#dragStartScrollX = 0;
		this.#pageTurnThreshold = 0.35;
		this.#dragSpeedMultiplier = 1;
	}

	//==============================================================================
	// 페이지 수 설정.
	//==============================================================================
	/**
	 * @param { number } pageCount
	 */
	setPageCount(pageCount) {
		this.#pageCount = pageCount;
	}

	//==============================================================================
	// 페이지 폭 설정. (보통 뷰 폭)
	//==============================================================================
	/**
	 * @param { number } pageWidth
	 */
	setPageWidth(pageWidth) {
		this.#pageWidth = pageWidth;
	}

	//==============================================================================
	// 페이지 전환 임계 비율 설정. (페이지 폭 대비 — 기본 0.35)
	//==============================================================================
	/**
	 * @param { number } pageTurnThreshold
	 */
	setPageTurnThreshold(pageTurnThreshold) {
		this.#pageTurnThreshold = pageTurnThreshold;
	}

	//==============================================================================
	// 드래그 반영 배율 설정. (1 = 손가락 이동량 그대로)
	//==============================================================================
	/**
	 * @param { number } dragSpeedMultiplier
	 */
	setDragSpeedMultiplier(dragSpeedMultiplier) {
		this.#dragSpeedMultiplier = dragSpeedMultiplier;
	}

	//==============================================================================
	// 현재 페이지 반환.
	//==============================================================================
	/**
	 * @returns { number }
	 */
	getCurrentPage() {
		return this.#currentPage;
	}

	//==============================================================================
	// 현재 페이지 설정. (스크롤은 tick 에서 부드럽게 따라감)
	//==============================================================================
	/**
	 * @param { number } page
	 */
	setCurrentPage(page) {
		const clampedPage = System.Math.min(System.Math.max(page, 0), this.#pageCount - 1);
		this.#currentPage = clampedPage;
	}

	//==============================================================================
	// 현재 스크롤 x 반환. (콘텐츠를 이만큼 이동해 그린다 — 0 이하)
	//==============================================================================
	/**
	 * @returns { number }
	 */
	getScrollX() {
		return this.#scrollX;
	}

	//==============================================================================
	// 터치 누름.
	//==============================================================================
	/**
	 * @param { object } viewInputPosition
	 */
	touchPress(viewInputPosition) {
		this.#isDragging = true;
		this.#dragMoved = false;
		this.#dragStartX = viewInputPosition.x;
		this.#dragStartScrollX = this.#scrollX;
	}

	//==============================================================================
	// 터치 이동.
	//==============================================================================
	/**
	 * @param { object } viewInputPosition
	 */
	touchMove(viewInputPosition) {
		if (!this.#isDragging) {
			return;
		}
		const deltaX = viewInputPosition.x - this.#dragStartX;
		if (System.Math.abs(deltaX) > SCROLL_DRAG_THRESHOLD) {
			this.#dragMoved = true;
		}
		const minScrollX = -(this.#pageCount - 1) * this.#pageWidth;
		const proposedScrollX = this.#dragStartScrollX + deltaX * this.#dragSpeedMultiplier;
		this.#scrollX = System.Math.min(System.Math.max(proposedScrollX, minScrollX), 0);
	}

	//==============================================================================
	// 터치 뗌. 스와이프면 임계 비율에 따라 페이지 전환, 움직임이 작으면 탭으로 판정.
	//==============================================================================
	/**
	 * @param { object } viewInputPosition
	 * @returns { boolean } 탭 여부.
	 */
	touchRelease(viewInputPosition) {
		const wasDragging = this.#isDragging;
		const wasMoved = this.#dragMoved;
		this.#isDragging = false;
		if (!wasDragging) {
			return false;
		}
		if (!wasMoved) {
			return true;
		}
		this.#currentPage = this.snapPageFromScroll();
		return false;
	}

	//==============================================================================
	// 스크롤 위치로부터 목표 페이지 계산. (현재 페이지에서 임계 비율 이상 민 방향으로 전환)
	//==============================================================================
	/**
	 * @returns { number }
	 */
	snapPageFromScroll() {
		const rawPage = -this.#scrollX / this.#pageWidth;
		const pageOffset = rawPage - this.#currentPage;
		let targetPage = this.#currentPage;
		if (pageOffset >= this.#pageTurnThreshold) {
			targetPage = this.#currentPage + 1;
		}
		else if (pageOffset <= -this.#pageTurnThreshold) {
			targetPage = this.#currentPage - 1;
		}
		const clampedPage = System.Math.min(System.Math.max(targetPage, 0), this.#pageCount - 1);
		return clampedPage;
	}

	//==============================================================================
	// 갱신. (놓은 뒤 목표 페이지 위치로 부드럽게 이동)
	//==============================================================================
	/**
	 * @param { number } timeDelta
	 */
	tick(timeDelta) {
		if (this.#isDragging) {
			return;
		}
		const targetScrollX = -this.#currentPage * this.#pageWidth;
		const difference = targetScrollX - this.#scrollX;
		if (System.Math.abs(difference) < 0.5) {
			this.#scrollX = targetScrollX;
			return;
		}
		const factor = System.Math.min(1, timeDelta * 14);
		this.#scrollX = this.#scrollX + difference * factor;
	}
}
