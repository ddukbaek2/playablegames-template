#!/usr/bin/env node
//==============================================================================
// capacitor.config.json 에 남아있는 <...> 플레이스홀더를 감지하여 빌드를 중단.
// 사용자가 본인 앱 정보로 대체하지 않은 채 빌드/스테이지가 진행되는 것을 방지한다.
//==============================================================================
"use strict";
const fs = require("fs");
const path = require("path");

const platformRoot = path.resolve(__dirname, "..");
const configPath = path.join(platformRoot, "capacitor.config.json");

if (!fs.existsSync(configPath)) {
	console.error(`[validate] capacitor.config.json 을 찾을 수 없습니다: ${configPath}`);
	process.exit(1);
}

const configText = fs.readFileSync(configPath, "utf8");
const placeholderTokens = ["<appId>", "<appName>"];
const remaining = placeholderTokens.filter(token => configText.includes(token));

if (remaining.length > 0) {
	console.error("[validate] capacitor.config.json 에 미설정 플레이스홀더가 남아있습니다.");
	console.error(`  파일: ${configPath}`);
	console.error(`  남은 토큰: ${remaining.join(", ")}`);
	console.error("  다음 값을 실제 앱 정보로 수정하세요:");
	console.error("    - appId                  (예: com.mycompany.myapp)");
	console.error("    - appName                (사용자에게 보일 앱 이름)");
	process.exit(1);
}
