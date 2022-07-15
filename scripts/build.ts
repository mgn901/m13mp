import * as esbuild from 'esbuild';
import * as fs from 'fs';
import sassPlugin from 'esbuild-sass-plugin';

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const isDev = NODE_ENV === 'development';
const outDir = NODE_ENV;

const options: esbuild.BuildOptions = {
	entryPoints: [
		'./src/index.tsx',
		// './src/worker.ts',
		// './src/serviceWorker.ts',
	],
	outdir: `./${outDir}`,
	bundle: true,
	define: {
		'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
	},
	minify: !isDev,
	sourcemap: isDev,
	watch: isDev ? {
		onRebuild: (err, res) => {
			if (err) {
				console.error(err.message);
			} else {
				console.log(`${new Date().toISOString()}: Built Successfully.`);
			}
		},
	} : false,
	target: ['chrome98', 'firefox97', 'edge98', 'safari14'],
	plugins: [sassPlugin()],
};

esbuild.build(options).then(result => {
	const copiedFiles = [
		'index.html',
		// 'manifest.json',
		// 'icons/favicon.ico',
		// 'icons/icon-192x192.png',
		// 'icons/icon-512x512.png',
	];
	if (!fs.existsSync(`./${outDir}/icons`)) {
		fs.mkdirSync(`./${outDir}/icons`);
	}
	for (let i = 0; i < copiedFiles.length; i += 1) {
		const copiedFilePath = copiedFiles[i];
		fs.copyFileSync(`./src/${copiedFilePath}`, `./${outDir}/${copiedFilePath}`);
	}
	console.log(`${new Date().toISOString()}: Built Successfully.`);
});
