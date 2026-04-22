#!/usr/bin/env node
//==============================================================================
// 원스토어 제출용 AAB 빌드.
// stage → cap sync → gradle :app:bundleRelease 순차 실행.
//
// 사용법:
//   node tools/buildaab.cjs
//
// 결과물:
//   android/app/build/outputs/bundle/release/app-release.aab
//==============================================================================
"use strict";
const fileSystem = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const platformRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(platformRoot, "..", "..");
const { stage } = require(path.join(projectRoot, "libs", "vanilla.js", "tools", "project.cjs"));

const isWindows = process.platform === "win32";

let exitCode = 0;
try {
	stage(path.join(projectRoot, "build", "web"), path.join(platformRoot, "www"), null);

	const capacitorCommand = isWindows ? "npx.cmd" : "npx";

	// android/ 가 없으면 최초 1회 'cap add android' 로 스캐폴드 생성.
	const androidDirectory = path.join(platformRoot, "android");
	if (!fileSystem.existsSync(androidDirectory)) {
		console.log("[buildaab] android/ 디렉토리가 없어 'npx cap add android' 를 실행합니다.");
		const addResult = spawnSync(capacitorCommand, ["cap", "add", "android"], {
			stdio: "inherit",
			cwd: platformRoot,
			shell: isWindows,
		});
		if (addResult.status !== 0) {
			exitCode = addResult.status === null ? 1 : addResult.status;
			throw new Error("[buildaab] cap add android 실패. Android SDK / JDK 설치 상태를 확인하세요.");
		}
	}

	const syncResult = spawnSync(capacitorCommand, ["cap", "sync", "android"], {
		stdio: "inherit",
		cwd: platformRoot,
		shell: isWindows,
	});
	if (syncResult.status !== 0) {
		exitCode = syncResult.status === null ? 1 : syncResult.status;
		throw new Error("[buildaab] cap sync android 실패.");
	}

	const gradleCommand = isWindows ? "gradlew.bat" : "./gradlew";
	const gradleResult = spawnSync(gradleCommand, [":app:bundleRelease"], {
		stdio: "inherit",
		cwd: androidDirectory,
		shell: isWindows,
	});
	if (gradleResult.status !== 0) {
		exitCode = gradleResult.status === null ? 1 : gradleResult.status;
		throw new Error("[buildaab] gradle bundleRelease 실패.");
	}
}
catch (error) {
	if (exitCode === 0) {
		exitCode = 1;
	}
	console.error(error.message);
}

process.exit(exitCode);
