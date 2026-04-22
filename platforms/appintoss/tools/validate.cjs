#!/usr/bin/env node
//==============================================================================
// granite.config.ts 에 남아있는 <...> 플레이스홀더를 감지하여 빌드를 중단.
// 사용자가 본인 앱 정보로 대체하지 않은 채 빌드/스테이지가 진행되는 것을 방지한다.
//==============================================================================
'use strict';
const fs = require('fs');
const path = require('path');

const platformRoot = path.resolve(__dirname, '..');
const configPath = path.join(platformRoot, 'granite.config.ts');

if (!fs.existsSync(configPath)) {
	console.error(`[validate] granite.config.ts 를 찾을 수 없습니다: ${configPath}`);
	process.exit(1);
}

const configText = fs.readFileSync(configPath, 'utf8');
const placeholderTokens = ['<appName>', '<displayName>', '<icon>'];
const remaining = placeholderTokens.filter(token => configText.includes(token));

if (remaining.length > 0) {
	console.error('[validate] granite.config.ts 에 미설정 플레이스홀더가 남아있습니다.');
	console.error(`  파일: ${configPath}`);
	console.error(`  남은 토큰: ${remaining.join(', ')}`);
	console.error('  다음 값을 실제 앱 정보로 수정하세요:');
	console.error('    - appName                (앱인토스에서 부여받은 appName)');
	console.error('    - brand.displayName      (사용자에게 보일 앱 이름)');
	console.error('    - brand.icon             (아이콘 이미지 경로)');
	process.exit(1);
}
