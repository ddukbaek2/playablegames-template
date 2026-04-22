#!/usr/bin/env node
//==============================================================================
// 디버그/테스트용 APK 빌드.
// stage → cap sync → gradle :app:assembleRelease 순차 실행.
//
// 사용법:
//   node tools/buildapk.cjs
//
// 결과물:
//   android/app/build/outputs/apk/release/app-release.apk
//==============================================================================
"use strict";
const fileSystem = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const platformRoot = path.resolve(__dirname, "..");

const isWindows = process.platform === "win32";

let exitCode = 0;
try {
	const stageResult = spawnSync(process.execPath, [path.join(__dirname, "stage.cjs")], {
		stdio: "inherit",
		cwd: platformRoot,
	});
	if (stageResult.status !== 0) {
		exitCode = stageResult.status === null ? 1 : stageResult.status;
		throw new Error("[buildapk] stage 실패.");
	}

	const capacitorCommand = isWindows ? "npx.cmd" : "npx";
	const syncResult = spawnSync(capacitorCommand, ["cap", "sync", "android"], {
		stdio: "inherit",
		cwd: platformRoot,
		shell: isWindows,
	});
	if (syncResult.status !== 0) {
		exitCode = syncResult.status === null ? 1 : syncResult.status;
		throw new Error("[buildapk] cap sync android 실패.");
	}

	const androidDirectory = path.join(platformRoot, "android");
	if (!fileSystem.existsSync(androidDirectory)) {
		console.error(`[buildapk] android/ 디렉토리가 없습니다. 먼저 'npx cap add android' 를 실행하세요.`);
		exitCode = 1;
		throw new Error("[buildapk] android/ 미존재.");
	}

	const gradleCommand = isWindows ? "gradlew.bat" : "./gradlew";
	const gradleResult = spawnSync(gradleCommand, [":app:assembleRelease"], {
		stdio: "inherit",
		cwd: androidDirectory,
		shell: isWindows,
	});
	if (gradleResult.status !== 0) {
		exitCode = gradleResult.status === null ? 1 : gradleResult.status;
		throw new Error("[buildapk] gradle assembleRelease 실패.");
	}
}
catch (error) {
	if (exitCode === 0) {
		exitCode = 1;
	}
	console.error(error.message);
}

process.exit(exitCode);
