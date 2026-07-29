#!/usr/bin/env node
//==============================================================================
// 헤드리스 브라우저 검증 하네스.
// build/web 을 올바른 MIME 으로 서빙하는 정적 서버 + puppeteer-core 헬퍼 모음.
// (css MIME 이 틀리면 캔버스가 기본 크기로 표시되어 오판하게 된다 — 반드시 이 서버를 쓸 것)
//
// 사용법 (단독 실행 — 게임을 띄워 일정 시간 뒤 스크린샷 저장):
//   node tools/verify.cjs [대기초=3] [출력파일=verify-shot.png]
//   환경변수 CHROME_PATH 로 크롬 경로를 지정할 수 있다. (기본: 윈도우 표준 설치 경로)
//
// 사용법 (커스텀 스크립트에서 헬퍼로 사용):
//   const { startStaticServer, launchBrowser, holdTap, captureCanvas } = require("./tools/verify.cjs");
//   - holdTap: touchRelease 기반 버튼은 click 이 안 먹히므로 지속탭(press 180ms)으로 누른다.
//   - captureCanvas: 캔버스 내용만 dataURL 로 뽑아 저장한다. (페이지 스크린샷보다 정확)
//
// puppeteer-core 는 devDependency 로 두지 않는다 — 필요 시 npm install puppeteer-core 후 사용.
//==============================================================================
"use strict";
const path = require("path");
const http = require("http");
const fs = require("fs");


const projectRoot = path.resolve(__dirname, "..");
const defaultServeRoot = path.join(projectRoot, "build", "web");
const defaultChromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const MIME_TYPES = {
	".html": "text/html",
	".js": "text/javascript",
	".css": "text/css",
	".json": "application/json",
	".png": "image/png",
	".jpg": "image/jpeg",
	".ico": "image/x-icon",
	".svg": "image/svg+xml",
	".ttf": "font/ttf",
	".otf": "font/otf",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".mp3": "audio/mpeg",
	".wav": "audio/wav",
	".ogg": "audio/ogg",
};


//==============================================================================
// 정적 서버 시작. 서버 인스턴스를 돌려준다. (server.close() 로 종료)
//==============================================================================
/**
 * @param { string } serveRoot
 * @param { number } port
 * @returns { Promise<object> }
 */
function startStaticServer(serveRoot, port) {
	const server = http.createServer((request, response) => {
		const urlPath = request.url.split("?")[0];
		const filePath = path.join(serveRoot, urlPath === "/" ? "index.html" : urlPath);
		if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
			response.writeHead(404);
			response.end();
			return;
		}
		const extension = path.extname(filePath).toLowerCase();
		const mimeType = MIME_TYPES[extension] || "application/octet-stream";
		response.writeHead(200, { "Content-Type": mimeType });
		response.end(fs.readFileSync(filePath));
	});
	return new Promise((resolve) => {
		server.listen(port, () => {
			resolve(server);
		});
	});
}


//==============================================================================
// 헤드리스 크롬 실행. puppeteer-core 브라우저 인스턴스를 돌려준다.
//==============================================================================
/**
 * @returns { Promise<object> }
 */
async function launchBrowser() {
	let puppeteer = null;
	try {
		puppeteer = require("puppeteer-core");
	}
	catch (error) {
		console.error("[verify] puppeteer-core 가 없습니다. `npm install puppeteer-core` 후 다시 실행하세요.");
		process.exit(1);
	}
	const chromePath = process.env.CHROME_PATH || defaultChromePath;
	const browser = await puppeteer.launch({
		executablePath: chromePath,
		headless: "new",
		args: ["--no-sandbox", "--hide-scrollbars"],
	});
	return browser;
}


//==============================================================================
// 지속탭. (touchRelease 기반 버튼은 click 이 press/release 매칭에 걸리지 않으므로 이 방식 필수)
//==============================================================================
/**
 * @param { object } page
 * @param { number } x
 * @param { number } y
 * @param { number } holdMilliseconds
 */
async function holdTap(page, x, y, holdMilliseconds = 180) {
	await page.touchscreen.touchStart(x, y);
	await new Promise((resolve) => setTimeout(resolve, holdMilliseconds));
	await page.touchscreen.touchEnd();
	await new Promise((resolve) => setTimeout(resolve, 500));
}


//==============================================================================
// 캔버스 내용 캡처. (canvas.toDataURL — 페이지 합성과 무관하게 게임 화면만 뽑는다)
//==============================================================================
/**
 * @param { object } page
 * @param { string } outputFilePath
 */
async function captureCanvas(page, outputFilePath) {
	const dataUrl = await page.evaluate(() => {
		const canvasElement = document.querySelector("canvas");
		return canvasElement === null ? null : canvasElement.toDataURL("image/png");
	});
	if (dataUrl === null) {
		console.error("[verify] 캔버스를 찾지 못했습니다.");
		return;
	}
	const base64Content = dataUrl.split(",")[1];
	fs.writeFileSync(outputFilePath, Buffer.from(base64Content, "base64"));
}


//==============================================================================
// 단독 실행: 게임을 띄워 대기 후 캔버스 스크린샷 저장 + 페이지 에러 보고.
//==============================================================================
async function main() {
	const waitSeconds = Number(process.argv[2] || 3);
	const outputFilePath = path.resolve(process.argv[3] || "verify-shot.png");
	const port = 8790;

	const server = await startStaticServer(defaultServeRoot, port);
	const browser = await launchBrowser();
	const page = await browser.newPage();
	await page.setViewport({ width: 720, height: 1280, hasTouch: true });
	const pageErrors = [];
	page.on("pageerror", (error) => {
		pageErrors.push(error.message);
	});
	await page.goto(`http://localhost:${port}/`, { waitUntil: "networkidle0", timeout: 60000 });
	await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
	await captureCanvas(page, outputFilePath);
	await browser.close();
	server.close();
	console.log(`[verify] 캡처 저장: ${outputFilePath}`);
	console.log(`[verify] 페이지 에러: ${pageErrors.length === 0 ? "없음" : pageErrors.join(" | ")}`);
}


module.exports = { startStaticServer, launchBrowser, holdTap, captureCanvas };

if (require.main === module) {
	main();
}
