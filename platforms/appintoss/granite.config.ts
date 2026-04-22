import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
	appName: 'my-playable-app', // 앱인토스에서 부여받은 appName 으로 교체.
	brand: {
		displayName: 'My Playable App', // 화면에 노출될 앱의 이름으로 교체.
		primaryColor: '#3182F6', // 화면에 노출될 앱의 기본 색상으로 교체.
		icon: 'assets/icons/app_icon.png', // 화면에 노출될 앱의 아이콘 이미지 주소로 교체.
	},
	web: {
		host: '127.0.0.1',
		port: 5173,
		commands: {
			dev: 'vite --host',
			build: 'vite build --outDir dist/web',
		},
	},
	permissions: [],
	outdir: 'dist',
});
