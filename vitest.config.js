import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			'$env/static/private': path.join(root, 'src/__mocks__/env-private.js'),
			'$env/static/public': path.join(root, 'src/__mocks__/env-public.js'),
			'$lib': path.join(root, 'src/lib'),
		},
	},
	test: {
		include: ['src/**/*.test.js'],
		environment: 'node',
	},
});
