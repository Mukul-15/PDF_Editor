const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
	fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, UPLOADS_DIR),
	filename: (req, file, cb) => {
		const id = uuidv4();
		const ext = path.extname(file.originalname) || '.pdf';
		cb(null, `${id}${ext}`);
	},
});
const upload = multer({ storage });

// In-memory annotations: { fileId: { texts: [{page, x, y, text}], highlights: [{page, x, y, width, height}] } }
const annotationsStore = new Map();

app.post('/api/upload', upload.single('file'), (req, res) => {
	const fileId = path.parse(req.file.filename).name;
	annotationsStore.set(fileId, { texts: [], highlights: [] });
	res.json({ fileId, filename: req.file.filename });
});

app.get('/api/file/:id', (req, res) => {
	const filePath = path.join(UPLOADS_DIR, `${req.params.id}.pdf`);
	if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
	res.sendFile(filePath);
});

app.post('/api/annotations/:id', (req, res) => {
	const { id } = req.params;
	const current = annotationsStore.get(id) || { texts: [], highlights: [] };
	const { texts, highlights } = req.body || {};
	annotationsStore.set(id, {
		texts: Array.isArray(texts) ? texts : current.texts,
		highlights: Array.isArray(highlights) ? highlights : current.highlights,
	});
	res.json({ ok: true });
});

app.get('/api/annotations/:id', (req, res) => {
	const { id } = req.params;
	res.json(annotationsStore.get(id) || { texts: [], highlights: [] });
});

app.get('/api/export/:id', async (req, res) => {
	const { id } = req.params;
	const filePath = path.join(UPLOADS_DIR, `${id}.pdf`);
	if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
	const bytes = fs.readFileSync(filePath);
	const pdfDoc = await PDFDocument.load(bytes);

	const anns = annotationsStore.get(id) || { texts: [], highlights: [] };
	for (const t of anns.texts) {
		const page = pdfDoc.getPage(t.page ?? 0);
		page.drawText(String(t.text ?? ''), {
			x: Number(t.x ?? 50),
			y: Number(t.y ?? 700),
			size: 12,
			color: rgb(0, 0, 0),
		});
	}
	for (const h of anns.highlights) {
		const page = pdfDoc.getPage(h.page ?? 0);
		page.drawRectangle({
			x: Number(h.x ?? 40),
			y: Number(h.y ?? 680),
			width: Number(h.width ?? 100),
			height: Number(h.height ?? 16),
			color: rgb(1, 1, 0),
			opacity: 0.4,
		});
	}

	const out = await pdfDoc.save();
	res.setHeader('Content-Type', 'application/pdf');
	res.setHeader('Content-Disposition', `attachment; filename="annotated-${id}.pdf"`);
	res.send(Buffer.from(out));
});

app.use('/uploads', express.static(UPLOADS_DIR));

async function mountFrontend(app) {
	const isDev = process.env.NODE_ENV !== 'production';
	const clientRoot = path.resolve(__dirname, '../client');
	if (isDev) {
		const { createServer: createViteServer } = require('vite');
		const vite = await createViteServer({
			root: clientRoot,
			server: { middlewareMode: true },
		});
		app.use(vite.middlewares);
		// Serve index.html via Vite transform; skip known asset prefixes
		app.use(async (req, res, next) => {
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
		app.use(express.static(dist));
		app.get('*', (_req, res) => {
			res.sendFile(path.join(dist, 'index.html'));
		});
	}
}

const PORT = process.env.PORT || 4000;
mountFrontend(app).then(() => {
	app.listen(PORT, () => console.log(`All-in-one server: http://localhost:${PORT}`));
});
