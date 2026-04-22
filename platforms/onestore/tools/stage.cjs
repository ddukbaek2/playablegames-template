#!/usr/bin/env node
//==============================================================================
// 루트의 기본 빌드 결과물(build/web)을 platforms/onestore/www 로 복사.
//
// 사용법:
//   node tools/stage.cjs
//==============================================================================
"use strict";
const fileSystem = require("fs");
const path = require("path");


//==============================================================================
// 디렉토리를 재귀적으로 복사.
//==============================================================================
function copyDirectoryRecursive(sourceDirectory, destinationDirectory) {
	fileSystem.mkdirSync(destinationDirectory, { recursive: true });
	const entries = fileSystem.readdirSync(sourceDirectory, { withFileTypes: true });
	for (const entry of entries) {
		const sourceEntryPath = path.join(sourceDirectory, entry.name);
		const destinationEntryPath = path.join(destinationDirectory, entry.name);
		if (entry.isDirectory()) {
			copyDirectoryRecursive(sourceEntryPath, destinationEntryPath);
		}
		else {
			fileSystem.copyFileSync(sourceEntryPath, destinationEntryPath);
		}
	}
}


//==============================================================================
// 메인.
//==============================================================================
function stage() {
	const platformRoot = path.resolve(__dirname, "..");
	const projectRoot = path.resolve(platformRoot, "..", "..");

	const sourceDirectory = path.join(projectRoot, "build", "web");
	const destinationDirectory = path.join(platformRoot, "www");

	if (!fileSystem.existsSync(sourceDirectory)) {
		console.error(`[stage] 기본 빌드 결과물이 없습니다: ${sourceDirectory}`);
		console.error(`[stage] 먼저 루트에서 "npm run build" 를 실행하세요.`);
		process.exit(1);
	}

	if (fileSystem.existsSync(destinationDirectory)) {
		fileSystem.rmSync(destinationDirectory, { recursive: true, force: true });
	}
	fileSystem.mkdirSync(destinationDirectory, { recursive: true });

	copyDirectoryRecursive(sourceDirectory, destinationDirectory);

	console.log(`[stage] 복사 완료: ${sourceDirectory} -> ${destinationDirectory}`);
}


//==============================================================================
// 진입점.
//==============================================================================
stage();
