import angular from '@analogjs/vite-plugin-angular';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [angular({ tsconfig: fileURLToPath(new URL('./src/tsconfig.spec.json', import.meta.url)) })],
	resolve: {
		alias: {
			src: fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	test: {
		environment: 'jsdom',
		globals: true,
		include: ['src/**/*.spec.ts'],
		setupFiles: ['./src/setup-vitest.ts'],
	},
});
