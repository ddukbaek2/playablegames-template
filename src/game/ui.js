//==============================================================================
// 포함 모듈 목록.
//==============================================================================
const System = globalThis;


//==============================================================================
// 캔버스 UI 재사용 유틸. (나인슬라이스 / 버튼 / 토스트 / 자동 개행 텍스트)
//
// 게임별 자산(폰트·이미지·색상)은 하드코딩하지 않고 세터로 주입한다.
// 이미지가 주입되지 않은 상태에서도 색 사각형 폴백으로 동작한다. (로딩 중 안전)
//
// 권장 사용 패턴.
//   1. 부팅 시: setUiFontFamily(...) / setUiTheme({...}) 로 게임 테마를 주입한다.
//   2. 스프라이트 로드 후: setButtonImages(...) / setPanelImage(...) 로 이미지를 주입한다.
//   3. 각 화면의 draw 에서 drawButton / drawIconButton / drawToast 등을 호출한다.
//   4. 같은 화면에 나란히 놓인 아이콘 버튼들은 measureButtonLabelWidth 로 최장 라벨 폭을
//      구해 alignLabelWidth 로 넘기면 아이콘·라벨 시작 위치가 통일된다.
//==============================================================================


//==============================================================================
// 주입 상태. (폰트 / 테마 / 버튼·패널 이미지)
//==============================================================================
let uiFontFamily = "sans-serif";
let uiTheme = {
	textColor: "#e8e8e8", // 일반 텍스트.
	mutedColor: "#9aa3a0", // 흐린 텍스트. (비활성 라벨 등)
	panelColor: "#1c262c", // 플레인 버튼 몸체.
	panelBorderColor: "#3a4c52", // 플레인 비활성 테두리.
	shadowColor: "#0a0e10", // 플레인 비활성 몸체.
	buttonLabelColor: "#141712", // 이미지 버튼(밝은 몸체) 위 라벨.
	dimColor: "rgba(0, 0, 0, 0.72)", // 화면 딤드.
};
let buttonImageNormal = null;
let buttonImagePressed = null;
let buttonImageDisabled = null;
let buttonImageBorder = 16;
let panelImage = null;
let panelImageBorder = 64;
let buttonFontSize = 40;


//==============================================================================
// 폰트 패밀리 주입.
//==============================================================================
/**
 * @param { string } fontFamily
 */
export function setUiFontFamily(fontFamily) {
	uiFontFamily = fontFamily;
}


//==============================================================================
// 테마 부분 주입. (지정한 키만 덮어씀)
//==============================================================================
/**
 * @param { object } partialTheme
 */
export function setUiTheme(partialTheme) {
	uiTheme = System.Object.assign({}, uiTheme, partialTheme);
}


//==============================================================================
// 버튼 라벨 폰트 크기 주입.
//==============================================================================
/**
 * @param { number } fontSize
 */
export function setButtonFontSize(fontSize) {
	buttonFontSize = fontSize;
}


//==============================================================================
// 버튼 나인슬라이스 이미지(일반/누름/비활성) 주입.
//==============================================================================
/**
 * @param { HTMLImageElement } normalImage
 * @param { HTMLImageElement } pressedImage
 * @param { HTMLImageElement } disabledImage
 * @param { number } borderSize 나인슬라이스 보더 두께. (원본 픽셀 기준)
 */
export function setButtonImages(normalImage, pressedImage, disabledImage, borderSize) {
	buttonImageNormal = normalImage;
	buttonImagePressed = pressedImage;
	buttonImageDisabled = disabledImage;
	if (borderSize !== null && borderSize !== undefined) {
		buttonImageBorder = borderSize;
	}
}


//==============================================================================
// 팝업/토스트 패널 나인슬라이스 이미지 주입.
//==============================================================================
/**
 * @param { HTMLImageElement } image
 * @param { number } borderSize 나인슬라이스 보더 두께. (원본 픽셀 기준)
 */
export function setPanelImage(image, borderSize) {
	panelImage = image;
	if (borderSize !== null && borderSize !== undefined) {
		panelImageBorder = borderSize;
	}
}


//==============================================================================
// 패널 나인슬라이스 보더 두께 반환. (팝업 내부 여백 계산용)
//==============================================================================
/**
 * @returns { number }
 */
export function getPanelImageBorder() {
	return panelImageBorder;
}


//==============================================================================
// 사각 영역 내부 여부 반환.
//==============================================================================
/**
 * @param { object } point
 * @param { object } rect
 * @returns { boolean }
 */
export function isInsideRect(point, rect) {
	const isInside = point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
	return isInside;
}


//==============================================================================
// 텍스트 출력.
//==============================================================================
/**
 * @param { CanvasRenderingContext2D } canvasRenderingContext
 * @param { string } text
 * @param { number } x
 * @param { number } y
 * @param { number } fontSize
 * @param { string } color
 * @param { string } align
 * @param { string } baseline
 */
export function drawText(canvasRenderingContext, text, x, y, fontSize, color, align, baseline) {
	canvasRenderingContext.font = fontSize + "px '" + uiFontFamily + "'";
	canvasRenderingContext.fillStyle = color;
	canvasRenderingContext.textAlign = align;
	canvasRenderingContext.textBaseline = baseline;
	canvasRenderingContext.fillText(text, x, y);
}


//==============================================================================
// 나인슬라이스 출력. (모서리는 원본 크기 유지, 변/중앙만 늘림)
//==============================================================================
/**
 * @param { CanvasRenderingContext2D } canvasRenderingContext
 * @param { HTMLImageElement } image
 * @param { number } x
 * @param { number } y
 * @param { number } width
 * @param { number } height
 * @param { number } borderSize
 */
export function drawNineSlice(canvasRenderingContext, image, x, y, width, height, borderSize) {
	const imageWidth = image.width;
	const imageHeight = image.height;
	const sourceBorder = borderSize;
	const destinationBorder = borderSize;
	const sourceCenterWidth = imageWidth - sourceBorder * 2;
	const sourceCenterHeight = imageHeight - sourceBorder * 2;
	const destinationCenterWidth = width - destinationBorder * 2;
	const destinationCenterHeight = height - destinationBorder * 2;

	// 네 모서리.
	canvasRenderingContext.drawImage(image, 0, 0, sourceBorder, sourceBorder, x, y, destinationBorder, destinationBorder);
	canvasRenderingContext.drawImage(image, imageWidth - sourceBorder, 0, sourceBorder, sourceBorder, x + width - destinationBorder, y, destinationBorder, destinationBorder);
	canvasRenderingContext.drawImage(image, 0, imageHeight - sourceBorder, sourceBorder, sourceBorder, x, y + height - destinationBorder, destinationBorder, destinationBorder);
	canvasRenderingContext.drawImage(image, imageWidth - sourceBorder, imageHeight - sourceBorder, sourceBorder, sourceBorder, x + width - destinationBorder, y + height - destinationBorder, destinationBorder, destinationBorder);

	// 네 변.
	canvasRenderingContext.drawImage(image, sourceBorder, 0, sourceCenterWidth, sourceBorder, x + destinationBorder, y, destinationCenterWidth, destinationBorder);
	canvasRenderingContext.drawImage(image, sourceBorder, imageHeight - sourceBorder, sourceCenterWidth, sourceBorder, x + destinationBorder, y + height - destinationBorder, destinationCenterWidth, destinationBorder);
	canvasRenderingContext.drawImage(image, 0, sourceBorder, sourceBorder, sourceCenterHeight, x, y + destinationBorder, destinationBorder, destinationCenterHeight);
	canvasRenderingContext.drawImage(image, imageWidth - sourceBorder, sourceBorder, sourceBorder, sourceCenterHeight, x + width - destinationBorder, y + destinationBorder, destinationBorder, destinationCenterHeight);

	// 중앙.
	canvasRenderingContext.drawImage(image, sourceBorder, sourceBorder, sourceCenterWidth, sourceCenterHeight, x + destinationBorder, y + destinationBorder, destinationCenterWidth, destinationCenterHeight);
}


//==============================================================================
// 화면 딤드 출력.
//==============================================================================
/**
 * @param { CanvasRenderingContext2D } canvasRenderingContext
 * @param { object } viewSize
 */
export function drawDim(canvasRenderingContext, viewSize) {
	canvasRenderingContext.fillStyle = uiTheme.dimColor;
	canvasRenderingContext.fillRect(0, 0, viewSize.x, viewSize.y);
}


//==============================================================================
// 버튼 라벨 폭 실측. (버튼 라벨과 동일한 폰트 기준)
// 한 화면에 나란히 놓인 아이콘 버튼들의 최장 라벨 폭을 구해 정렬 기준으로 쓸 때 사용한다.
//==============================================================================
/**
 * @param { CanvasRenderingContext2D } canvasRenderingContext
 * @param { string } label
 * @returns { number }
 */
export function measureButtonLabelWidth(canvasRenderingContext, label) {
	canvasRenderingContext.font = buttonFontSize + "px '" + uiFontFamily + "'";
	const labelMetrics = canvasRenderingContext.measureText(label);
	const labelWidth = labelMetrics.width;
	return labelWidth;
}


//==============================================================================
// 버튼 배경 출력. (상태에 맞는 나인슬라이스 이미지, 미주입 시 색 사각형 폴백)
//==============================================================================
/**
 * @param { CanvasRenderingContext2D } canvasRenderingContext
 * @param { object } rect
 * @param { string } accentColor
 * @param { HTMLImageElement } stateImage
 */
function drawButtonBackground(canvasRenderingContext, rect, accentColor, stateImage) {
	if (stateImage !== null && stateImage !== undefined) {
		drawNineSlice(canvasRenderingContext, stateImage, rect.x, rect.y, rect.width, rect.height, buttonImageBorder);
		return;
	}
	canvasRenderingContext.fillStyle = uiTheme.panelColor;
	canvasRenderingContext.fillRect(rect.x, rect.y, rect.width, rect.height);
	canvasRenderingContext.lineWidth = 4;
	canvasRenderingContext.strokeStyle = accentColor;
	canvasRenderingContext.strokeRect(rect.x, rect.y, rect.width, rect.height);
}


//==============================================================================
// 버튼 출력. (isPressed 가 참이면 누름 상태 이미지 + 라벨 눌림 표현)
//==============================================================================
/**
 * @param { CanvasRenderingContext2D } canvasRenderingContext
 * @param { object } rect
 * @param { string } label
 * @param { string } accentColor
 * @param { boolean } isPressed
 */
export function drawButton(canvasRenderingContext, rect, label, accentColor, isPressed) {
	const stateImage = isPressed === true ? buttonImagePressed : buttonImageNormal;
	drawButtonBackground(canvasRenderingContext, rect, accentColor, stateImage);

	// 누른 상태는 라벨을 살짝 내려 눌림을 표현한다. (라벨은 밝은 버튼 몸체 위에서 보이도록 지정 색)
	const labelOffsetY = isPressed === true ? 3 : 0;
	const labelColor = stateImage !== null && stateImage !== undefined ? uiTheme.buttonLabelColor : accentColor;
	canvasRenderingContext.fillStyle = labelColor;
	canvasRenderingContext.font = buttonFontSize + "px '" + uiFontFamily + "'";
	canvasRenderingContext.textAlign = "center";
	canvasRenderingContext.textBaseline = "middle";
	canvasRenderingContext.fillText(label, rect.x + rect.width * 0.5, rect.y + rect.height * 0.5 + labelOffsetY);
}


//==============================================================================
// 비활성화 버튼 출력. (어둡게 처리 + 흐린 라벨로 사용 불가 표시)
//==============================================================================
/**
 * @param { CanvasRenderingContext2D } canvasRenderingContext
 * @param { object } rect
 * @param { string } label
 */
export function drawButtonDisabled(canvasRenderingContext, rect, label) {
	if (buttonImageDisabled !== null && buttonImageDisabled !== undefined) {
		drawNineSlice(canvasRenderingContext, buttonImageDisabled, rect.x, rect.y, rect.width, rect.height, buttonImageBorder);
	}
	else {
		canvasRenderingContext.fillStyle = uiTheme.shadowColor;
		canvasRenderingContext.fillRect(rect.x, rect.y, rect.width, rect.height);
		canvasRenderingContext.lineWidth = 4;
		canvasRenderingContext.strokeStyle = uiTheme.panelBorderColor;
		canvasRenderingContext.strokeRect(rect.x, rect.y, rect.width, rect.height);
	}

	canvasRenderingContext.fillStyle = uiTheme.mutedColor;
	canvasRenderingContext.font = buttonFontSize + "px '" + uiFontFamily + "'";
	canvasRenderingContext.textAlign = "center";
	canvasRenderingContext.textBaseline = "middle";
	canvasRenderingContext.fillText(label, rect.x + rect.width * 0.5, rect.y + rect.height * 0.5);
}


//==============================================================================
// 플레인 버튼 출력. (나인슬라이스 이미지를 쓰지 않는 색 사각형 스타일 — 격자 등 소형 버튼용)
//==============================================================================
/**
 * @param { CanvasRenderingContext2D } canvasRenderingContext
 * @param { object } rect
 * @param { string } label
 * @param { string } accentColor
 */
export function drawButtonPlain(canvasRenderingContext, rect, label, accentColor) {
	canvasRenderingContext.fillStyle = uiTheme.panelColor;
	canvasRenderingContext.fillRect(rect.x, rect.y, rect.width, rect.height);
	canvasRenderingContext.lineWidth = 4;
	canvasRenderingContext.strokeStyle = accentColor;
	canvasRenderingContext.strokeRect(rect.x, rect.y, rect.width, rect.height);

	canvasRenderingContext.fillStyle = accentColor;
	canvasRenderingContext.font = buttonFontSize + "px '" + uiFontFamily + "'";
	canvasRenderingContext.textAlign = "center";
	canvasRenderingContext.textBaseline = "middle";
	canvasRenderingContext.fillText(label, rect.x + rect.width * 0.5, rect.y + rect.height * 0.5);
}


//==============================================================================
// 플레인 비활성 버튼 출력. (색 사각형 스타일)
//==============================================================================
/**
 * @param { CanvasRenderingContext2D } canvasRenderingContext
 * @param { object } rect
 * @param { string } label
 */
export function drawButtonPlainDisabled(canvasRenderingContext, rect, label) {
	canvasRenderingContext.fillStyle = uiTheme.shadowColor;
	canvasRenderingContext.fillRect(rect.x, rect.y, rect.width, rect.height);
	canvasRenderingContext.lineWidth = 4;
	canvasRenderingContext.strokeStyle = uiTheme.panelBorderColor;
	canvasRenderingContext.strokeRect(rect.x, rect.y, rect.width, rect.height);

	canvasRenderingContext.fillStyle = uiTheme.mutedColor;
	canvasRenderingContext.font = buttonFontSize + "px '" + uiFontFamily + "'";
	canvasRenderingContext.textAlign = "center";
	canvasRenderingContext.textBaseline = "middle";
	canvasRenderingContext.fillText(label, rect.x + rect.width * 0.5, rect.y + rect.height * 0.5);
}


//==============================================================================
// 아이콘 버튼 출력. (버튼 배경/테두리 + 아이콘·라벨 묶음을 중앙 정렬)
// 묶음 폭은 기준 라벨 폭(alignLabelWidth — 보통 형제 버튼들의 최장 라벨 폭)으로 잡아,
// 같은 화면의 버튼들이 아이콘 위치와 라벨 시작 위치를 공유하도록 통일한다.
// 라벨은 그 시작 위치에서 좌측 정렬로 출력한다. (짧은 라벨도 같은 열에서 시작)
//==============================================================================
/**
 * @param { CanvasRenderingContext2D } canvasRenderingContext
 * @param { object } rect
 * @param { string } label
 * @param { string } accentColor
 * @param { HTMLImageElement } iconImage
 * @param { number } alignLabelWidth 정렬 기준 라벨 폭. (생략 시 자기 라벨 폭)
 */
export function drawIconButton(canvasRenderingContext, rect, label, accentColor, iconImage, alignLabelWidth) {
	drawButtonBackground(canvasRenderingContext, rect, accentColor, buttonImageNormal);

	canvasRenderingContext.font = buttonFontSize + "px '" + uiFontFamily + "'";
	const labelMetrics = canvasRenderingContext.measureText(label);
	const labelWidth = labelMetrics.width;
	const referenceLabelWidth = alignLabelWidth !== null && alignLabelWidth !== undefined ? alignLabelWidth : labelWidth;

	const iconSize = 56;
	const iconGap = 20;
	const groupWidth = iconSize + iconGap + referenceLabelWidth;
	const groupLeft = rect.x + (rect.width - groupWidth) * 0.5;
	const buttonCenterY = rect.y + rect.height * 0.5;

	if (iconImage !== null && iconImage !== undefined) {
		canvasRenderingContext.drawImage(iconImage, groupLeft, buttonCenterY - iconSize * 0.5, iconSize, iconSize);
	}
	const labelColor = buttonImageNormal !== null && buttonImageNormal !== undefined ? uiTheme.buttonLabelColor : accentColor;
	canvasRenderingContext.fillStyle = labelColor;
	canvasRenderingContext.textAlign = "left";
	canvasRenderingContext.textBaseline = "middle";
	canvasRenderingContext.fillText(label, groupLeft + iconSize + iconGap, buttonCenterY);
}


//==============================================================================
// 텍스트를 최대 폭에 맞춰 줄 배열로 변환. (공백 단위, 긴 단어는 글자 단위 분할)
//==============================================================================
/**
 * @param { CanvasRenderingContext2D } canvasRenderingContext
 * @param { string } text
 * @param { number } maxWidth
 * @returns { string[] }
 */
export function wrapTextToLines(canvasRenderingContext, text, maxWidth) {
	const lines = [];
	const words = text.split(" ");
	let current = "";
	for (let index = 0; index < words.length; ++index) {
		const word = words[index];
		const candidate = current === "" ? word : current + " " + word;
		const candidateWidth = canvasRenderingContext.measureText(candidate).width;
		if (candidateWidth <= maxWidth) {
			current = candidate;
			continue;
		}
		if (current !== "") {
			lines.push(current);
			current = "";
		}
		const wordWidth = canvasRenderingContext.measureText(word).width;
		if (wordWidth <= maxWidth) {
			current = word;
			continue;
		}
		let chunk = "";
		for (let characterIndex = 0; characterIndex < word.length; ++characterIndex) {
			const character = word[characterIndex];
			const chunkCandidate = chunk + character;
			if (canvasRenderingContext.measureText(chunkCandidate).width <= maxWidth) {
				chunk = chunkCandidate;
			}
			else {
				if (chunk !== "") {
					lines.push(chunk);
				}
				chunk = character;
			}
		}
		current = chunk;
	}
	if (current !== "") {
		lines.push(current);
	}
	return lines;
}


//==============================================================================
// 자동 개행 텍스트 출력. (최대 폭을 넘으면 공백 단위로 줄바꿈, 긴 단어는 글자 단위 분할)
//==============================================================================
/**
 * @param { CanvasRenderingContext2D } canvasRenderingContext
 * @param { string } text
 * @param { number } centerX
 * @param { number } topY 첫 줄의 세로 중심.
 * @param { number } fontSize
 * @param { number } maxWidth
 * @param { string } color
 */
export function drawWrappedText(canvasRenderingContext, text, centerX, topY, fontSize, maxWidth, color) {
	canvasRenderingContext.font = fontSize + "px '" + uiFontFamily + "'";
	const lines = wrapTextToLines(canvasRenderingContext, text, maxWidth);
	const lineHeight = fontSize * 1.4;
	for (let index = 0; index < lines.length; ++index) {
		const lineText = lines[index];
		const lineY = topY + index * lineHeight;
		drawText(canvasRenderingContext, lineText, centerX, lineY, fontSize, color, "center", "middle");
	}
}


//==============================================================================
// 토스트 출력. (패널 나인슬라이스 + 중앙 문구, 잔여 시간 동안 하단에 표시)
// 호출 화면이 토스트 문구와 잔여 시간을 관리하고 매 프레임 이 함수로 그린다.
// 패널 이미지가 미주입이면 색 사각형 폴백으로 그린다.
//==============================================================================
/**
 * @param { CanvasRenderingContext2D } canvasRenderingContext
 * @param { object } viewSize
 * @param { string } message
 * @param { number } remainingSeconds
 */
export function drawToast(canvasRenderingContext, viewSize, message, remainingSeconds) {
	if (remainingSeconds <= 0) {
		return;
	}
	const toastFontSize = 26;
	canvasRenderingContext.font = toastFontSize + "px '" + uiFontFamily + "'";
	const messageMetrics = canvasRenderingContext.measureText(message);
	const messageWidth = messageMetrics.width;
	// 패널 나인슬라이스 보더 안쪽에 문구가 들어가도록 폭을 잡는다.
	const panelWidth = System.Math.min(System.Math.max(messageWidth + panelImageBorder * 2, 360), viewSize.x - 40);
	const panelHeight = panelImageBorder * 2 + 16;
	const panelX = System.Math.round((viewSize.x - panelWidth) * 0.5);
	const panelY = System.Math.round(viewSize.y - 240 - panelHeight * 0.5);
	// 사라지기 직전에는 서서히 투명해진다.
	const fadeDuration = 0.4;
	const alpha = System.Math.min(remainingSeconds / fadeDuration, 1);
	canvasRenderingContext.save();
	canvasRenderingContext.globalAlpha = alpha;
	if (panelImage !== null && panelImage !== undefined) {
		drawNineSlice(canvasRenderingContext, panelImage, panelX, panelY, panelWidth, panelHeight, panelImageBorder);
	}
	else {
		canvasRenderingContext.fillStyle = uiTheme.panelColor;
		canvasRenderingContext.fillRect(panelX, panelY, panelWidth, panelHeight);
		canvasRenderingContext.lineWidth = 4;
		canvasRenderingContext.strokeStyle = uiTheme.panelBorderColor;
		canvasRenderingContext.strokeRect(panelX, panelY, panelWidth, panelHeight);
	}
	const toastCenterX = panelX + panelWidth * 0.5;
	const toastCenterY = panelY + panelHeight * 0.5;
	drawText(canvasRenderingContext, message, toastCenterX, toastCenterY, toastFontSize, uiTheme.textColor, "center", "middle");
	canvasRenderingContext.restore();
}
