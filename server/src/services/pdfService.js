const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;

async function exportAnnotatedPdf(inputPath, annotations) {
	const bytes = await fs.readFile(inputPath);
	const pdfDoc = await PDFDocument.load(bytes);
	const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

	for (const t of annotations.texts) {
		const pageIndex = Number(t.page ?? 0);
		if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) continue;
		
		const page = pdfDoc.getPage(pageIndex);
		page.drawText(String(t.text ?? ''), {
			x: Number(t.x),
			y: Number(t.y),
			size: 12,
			font: helveticaFont,
			color: rgb(0, 0, 0),
		});
	}

	for (const h of annotations.highlights) {
		const pageIndex = Number(h.page ?? 0);
		if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) continue;

		const page = pdfDoc.getPage(pageIndex);
		// Note: pdf-lib drawRectangle uses x, y as bottom-left of the rectangle
		page.drawRectangle({
			x: Number(h.x),
			y: Number(h.y),
			width: Number(h.width),
			height: Number(h.height),
			color: rgb(1, 1, 0),
			opacity: 0.4,
		});
	}

	return await pdfDoc.save();
}

module.exports = {
	exportAnnotatedPdf,
};
