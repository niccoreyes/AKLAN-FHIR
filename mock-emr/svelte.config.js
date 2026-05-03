import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Enable Svelte 5 runes mode
		runes: true
	},
	kit: {
		adapter: adapter({
			runtime: 'nodejs18.x'
		}),
		alias: {
			$lib: './src/lib',
			$components: './src/lib/components',
			$services: './src/lib/services',
			$stores: './src/lib/stores',
			$utils: './src/lib/utils',
			$constants: './src/lib/constants'
		}
	}
};

export default config;
