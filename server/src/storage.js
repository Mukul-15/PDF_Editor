const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ANNOTATIONS_FILE = path.join(DATA_DIR, 'annotations.json');

async function ensureDataDir() {
	try {
		await fs.mkdir(DATA_DIR, { recursive: true });
	} catch (err) {
		if (err.code !== 'EEXIST') throw err;
	}
}

async function readAnnotations() {
	await ensureDataDir();
	try {
		const data = await fs.readFile(ANNOTATIONS_FILE, 'utf-8');
		return JSON.parse(data);
	} catch (err) {
		// Log error if it's more than just a missing file
		if (err.code !== 'ENOENT') {
			console.error('Error reading annotations file:', err);
		}
		return {};
	}
}

async function writeAnnotations(data) {
	await ensureDataDir();
	try {
		await fs.writeFile(ANNOTATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
	} catch (err) {
		console.error('Error writing annotations file:', err);
		throw err;
	}
}

module.exports = {
	get: async (id) => {
		const all = await readAnnotations();
		return all[id] || { texts: [], highlights: [] };
	},
	set: async (id, annotations) => {
		const all = await readAnnotations();
		all[id] = annotations;
		await writeAnnotations(all);
	},
	getAll: readAnnotations,
};
