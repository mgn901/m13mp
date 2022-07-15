const worker = self as unknown as ServiceWorkerGlobalScope;

const appVersion = 'app0.0.0';

const appURLs = [
	'./',
	'./index.js',
	'./index.css',
	'./manifest.json',
	// './icons/favicon.ico',
	// './icons/icon-192x192.png',
	// './icons/icon-512x512.png',
	'https://fonts.googleapis.com/icon?family=Material+Icons',
	'https://rsms.me/inter/inter.css',
].map(path => {
	return new URL(path, worker.registration.scope).pathname;
});

// All reponses will be cached into special cache or temporary cache ...
const cacheNames = [appVersion, 'temp'];

// ... so sw have to judge correct cacheName for all urls.
const judgeCacheName = (url: string) => {
	if (appURLs.includes(new URL(url).pathname)) {
		return appVersion;
	} else {
		return 'temp';
	}
}

// Add responses for assets on installation.
worker.addEventListener('install', (e) => {
	e.waitUntil(caches.open(appVersion).then((cache) => {
		return cache.addAll(appURLs);
	}));
});

// Delete old caches on activation.
worker.addEventListener('activate', (e) => {
	e.waitUntil(caches.keys().then((keys) => {
		return Promise.all(
			keys.map((key) => {
				if (cacheNames.includes(key) === true) {
					return;
				}
				return caches.delete(key);
			})
		);
	}));
});

worker.addEventListener('fetch', (e) => {
	e.respondWith(caches.match(e.request).then((cachedRes) => {
		const cacheName = judgeCacheName(e.request.url);
		const req = e.request.clone();
		if (cachedRes && cacheName === 'temp') {
			// temporary & cached
			// - If network is available, fetch and use new response.
			// - If network is unavailable, use cached response.
			return fetch(req).then((newRes) => {
				if (!newRes || newRes.ok === false) {
					return cachedRes;
				}
				let resToCache = newRes.clone();
				caches.open(cacheName).then((cache) => {
					cache.put(e.request, resToCache);
				});
				return newRes;
			});
		} else if (cachedRes) {
			// permanent & cached
			// - Use cached response all time.
			return cachedRes;
		} else {
			// not cached
			// - Fetch and use new response.
			return fetch(req).then((res) => {
				if (!res || res.ok === false) {
					return res;
				}
				let resToCache = res.clone();
				caches.open(cacheName).then((cache) => {
					cache.put(e.request, resToCache);
				});
				return res;
			});
		}
	}));
});
