#!/usr/bin/env node
//==============================================================================
// 루트의 기본 빌드 결과물(build/web)을 platforms/appintoss/public 으로 복사.
//
// 사용법:
//   node tools/stage.cjs
//
// 동작:
//   1) <repoRoot>/build/web 의 결과물을 platforms/appintoss/public 에 복사.
//      (index.html 은 제외. 루트 index.html 이 vite 엔트리로 사용되기 때문.)
//==============================================================================
'use strict';
const fs = require('fs');
const path = require('path');


//==============================================================================
// 재귀 복사.
//==============================================================================
function copyDirRecursive(src, dest) {
	fs.mkdirSync(dest, { recursive: true });
	const entries = fs.readdirSync(src, { withFileTypes: true });
	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);
		if (entry.isDirectory()) {
			copyDirRecursive(srcPath, destPath);
		}
		else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}


//==============================================================================
// 루트 건너뛰기 옵션을 지원하는 복사.
//==============================================================================
function copyDir(src, dest, skipTopLevel) {
	fs.mkdirSync(dest, { recursive: true });
	const entries = fs.readdirSync(src, { withFileTypes: true });
	for (const entry of entries) {
		if (skipTopLevel && skipTopLevel.has(entry.name)) {
			continue;
		}
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);
		if (entry.isDirectory()) {
			copyDirRecursive(srcPath, destPath);
		}
		else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}


//==============================================================================
// 메인.
//==============================================================================
function stage() {
	const platformRoot = path.resolve(__dirname, '..');
	const projectRoot = path.resolve(platformRoot, '..', '..');

	const sourceDir = path.join(projectRoot, 'build', 'web');
	const targetDir = path.join(platformRoot, 'public');

	if (!fs.existsSync(sourceDir)) {
		console.error(`[stage] 기본 빌드 결과물이 없습니다: ${sourceDir}`);
		console.error(`[stage] 먼저 루트에서 "npm run build" 를 실행하세요.`);
		process.exit(1);
	}

	// 대상 디렉토리 초기화.
	if (fs.existsSync(targetDir)) {
		fs.rmSync(targetDir, { recursive: true, force: true });
	}
	fs.mkdirSync(targetDir, { recursive: true });

	// index.html 은 제외(루트 index.html 이 vite 엔트리).
	const skipTopLevel = new Set(['index.html']);
	copyDir(sourceDir, targetDir, skipTopLevel);

	console.log(`[stage] 복사 완료: ${sourceDir} -> ${targetDir}`);
}


//==============================================================================
// 진입점.
//==============================================================================
stage();
