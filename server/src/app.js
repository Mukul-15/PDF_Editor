const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const storage = require('./storage');
const pdfService = require('./services/pdfService');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
	fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage
const multerStorage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, UPLOADS_DIR),
	filename: (req, file, cb) => {
		const id = uuidv4();
		const ext = path.extname(file.originalname) || '.pdf';
		cb(null, `${id}${ext}`);
	},
});
const upload = multer({ 
	storage: multerStorage,
	fileFilter: (req, file, cb) => {
		if (file.mimetype !== 'application/pdf') {
			return cb(new Error('Only PDFs are allowed'), false);
		}
		cb(null, true);
	}
});

// API Routes
app.post('/api/upload', upload.single('file'), async (req, res) => {
	if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
	const fileId = path.parse(req.file.filename).name;
	await storage.set(fileId, { texts: [], highlights: [] });
	res.json({ fileId, filename: req.file.filename });
});

app.get('/api/file/:id', (req, res) => {
	const filePath = path.join(UPLOADS_DIR, `${req.params.id}.pdf`);
	if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
	res.sendFile(filePath);
});

app.post('/api/annotations/:id', async (req, res) => {
	const { id } = req.params;
	const current = await storage.get(id);
	const { texts, highlights } = req.body || {};
	await storage.set(id, {
		texts: Array.isArray(texts) ? texts : current.texts,
		highlights: Array.isArray(highlights) ? highlights : current.highlights,
	});
	res.json({ ok: true });
});

app.get('/api/annotations/:id', async (req, res) => {
	const { id } = req.params;
	const anns = await storage.get(id);
	res.json(anns);
});

app.delete('/api/annotations/:id', async (req, res) => {
	const { id } = req.params;
	await storage.set(id, { texts: [], highlights: [] });
	res.json({ ok: true, message: 'Annotations cleared' });
});

app.get('/api/export/:id', async (req, res) => {
	const { id } = req.params;
	const filePath = path.join(UPLOADS_DIR, `${id}.pdf`);
	if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

	try {
		const annotations = await storage.get(id);
		const outBytes = await pdfService.exportAnnotatedPdf(filePath, annotations);
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', `attachment; filename="annotated-${id}.pdf"`);
		res.send(Buffer.from(outBytes));
	} catch (error) {
		console.error('Export error:', error);
		res.status(500).json({ error: 'Failed to process PDF' });
	}
});

// Middleware for static files or frontend will be handled in index.js
module.exports = { app, UPLOADS_DIR };
