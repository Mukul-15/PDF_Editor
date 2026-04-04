const path = require('path');
const fs = require('fs');
const { app, UPLOADS_DIR } = require('./src/app');

// Serve static uploads
app.use('/uploads', (req, res, next) => {
	// Simple ID-based check could be added here in the future
	next();
}, require('express').static(UPLOADS_DIR));

async function mountFrontend(expressApp) {
	const isDev = process.env.NODE_ENV !== 'production';
	const clientRoot = path.resolve(__dirname, '../client');
	
	if (isDev) {
		const { createServer: createViteServer } = require('vite');
		const vite = await createViteServer({
			root: clientRoot,
			server: { middlewareMode: true },
		});
		expressApp.use(vite.middlewares);
		expressApp.use(async (req, res, next) => {
			if (req.method !== 'GET') return next();
			const url = req.originalUrl;
			if (
				url.startsWith('/api') ||
				url.startsWith('/uploads') ||
				url.startsWith('/src/') ||
				url.startsWith('/@') ||
				url.includes('/node_modules/')
			) {
				return next();
			}
			try {
				let html = fs.readFileSync(path.join(clientRoot, 'index.html'), 'utf-8');
				html = await vite.transformIndexHtml(url, html);
				res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
			} catch (e) {
				vite.ssrFixStacktrace(e);
				next(e);
			}
		});
	} else {
		const dist = path.resolve(__dirname, '../client/dist');
		expressApp.use(require('express').static(dist));
		expressApp.get('*', (_req, res) => {
			res.sendFile(path.join(dist, 'index.html'));
		});
	}
}

const PORT = process.env.PORT || 4000;
mountFrontend(app).then(() => {
	app.listen(PORT, () => console.log(`PDF Editor server: http://localhost:${PORT}`));
});
