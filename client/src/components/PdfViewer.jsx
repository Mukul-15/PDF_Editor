import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const PDF_VIEW_WIDTH = 800; // Standard stable width for coordinate calculation

export default function PdfViewer({
	fileUrl,
	annotations = { texts: [], highlights: [] },
	onChange,
}) {
	const [numPages, setNumPages] = useState(0)
	const [currentPage, setCurrentPage] = useState(1)
	const [selectedTool, setSelectedTool] = useState(null)
	const [isDrawing, setIsDrawing] = useState(false)
	const [drawStart, setDrawStart] = useState(null)
	
	const canvasRef = useRef(null)
	const containerRef = useRef(null)
	const [pageSize, setPageSize] = useState(null)

	const onDocumentLoadSuccess = ({ numPages }) => {
		setNumPages(numPages)
	}

	const onPageLoadSuccess = (page) => {
		if (page && typeof page.getViewport === 'function') {
			const viewport = page.getViewport({ scale: 1 });
			setPageSize({ width: viewport.width, height: viewport.height });
		}
	}

	const handleCanvasClick = (event) => {
		if (!selectedTool || !fileUrl || !pageSize || !onChange) return

		const canvas = canvasRef.current
		if (!canvas) return

		const rect = canvas.getBoundingClientRect()
		const x = event.clientX - rect.left
		const y = event.clientY - rect.top

		const scale = PDF_VIEW_WIDTH / pageSize.width;
		const pdfX = x / scale;
		const pdfY = pageSize.height - (y / scale);

		if (selectedTool === 'text') {
			const text = prompt('Enter text annotation:')
			if (text) {
				const newAnnotation = {
					id: crypto.randomUUID(),
					page: currentPage - 1,
					x: pdfX,
					y: pdfY,
					text: text,
				}
				onChange({
					...annotations,
					texts: [...(annotations.texts || []), newAnnotation],
				})
			}
		} else if (selectedTool === 'highlight') {
			if (!isDrawing) {
				setIsDrawing(true)
				setDrawStart({ x, y })
			} else {
				if (drawStart) {
					const width = Math.abs(x - drawStart.x) / scale
					const height = Math.abs(y - drawStart.y) / scale
					const startX = Math.min(x, drawStart.x) / scale
					const startY = pageSize.height - (Math.max(y, drawStart.y) / scale)
					
					const newAnnotation = {
						id: crypto.randomUUID(),
						page: currentPage - 1,
						x: startX,
						y: startY,
						width: width,
						height: height,
					}
					onChange({
						...annotations,
						highlights: [...(annotations.highlights || []), newAnnotation],
					})
				}
				setIsDrawing(false)
				setDrawStart(null)
			}
		}
	}

	const deleteAnnotation = (id, type) => {
		if (!onChange) return
		const next = { ...annotations };
		if (type === 'texts') {
			next.texts = (next.texts || []).filter(a => a.id !== id);
		} else {
			next.highlights = (next.highlights || []).filter(a => a.id !== id);
		}
		onChange(next);
	}

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas || !pageSize) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		const scale = PDF_VIEW_WIDTH / pageSize.width;
		ctx.clearRect(0, 0, canvas.width, canvas.height)

		if (Array.isArray(annotations.texts)) {
			annotations.texts
				.filter(ann => ann.page === currentPage - 1)
				.forEach(ann => {
					const screenX = ann.x * scale;
					const screenY = (pageSize.height - ann.y) * scale;
					ctx.fillStyle = '#ffeb3b';
					ctx.font = 'bold 14px Arial';
					ctx.fillText(ann.text || '', screenX, screenY);
				})
		}

		if (Array.isArray(annotations.highlights)) {
			annotations.highlights
				.filter(ann => ann.page === currentPage - 1)
				.forEach(ann => {
					const screenX = ann.x * scale;
					const screenY = (pageSize.height - (ann.y + ann.height)) * scale;
					ctx.fillStyle = 'rgba(255, 235, 59, 0.4)';
					ctx.fillRect(screenX, screenY, ann.width * scale, ann.height * scale);
				})
		}

		if (isDrawing && drawStart) {
			ctx.strokeStyle = '#ffeb3b';
			ctx.lineWidth = 1;
			ctx.setLineDash([4, 4]);
		}
	}, [annotations, currentPage, pageSize, isDrawing, drawStart])

	if (!fileUrl) {
		return <div className="viewer-empty small muted">No PDF selected. Upload a PDF first.</div>
	}

	return (
		<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			<div className="viewer-toolbar">
				<button
					className={`btn ${selectedTool === 'text' ? 'btn-primary' : 'btn-outline'}`}
					onClick={() => setSelectedTool(selectedTool === 'text' ? null : 'text')}
				>
					Text
				</button>
				<button
					className={`btn ${selectedTool === 'highlight' ? 'btn-primary' : 'btn-outline'}`}
					onClick={() => setSelectedTool(selectedTool === 'highlight' ? null : 'highlight')}
				>
					Highlight
				</button>
				
				<div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
					<button className="btn btn-outline" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>←</button>
					<span className="small muted mono">{currentPage} / {numPages}</span>
					<button className="btn btn-outline" onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))} disabled={currentPage >= numPages}>→</button>
				</div>
			</div>

			<div ref={containerRef} className="viewer-canvas-container">
				<div style={{ position: 'relative', width: PDF_VIEW_WIDTH }}>
					<Document
						file={fileUrl}
						onLoadSuccess={onDocumentLoadSuccess}
						loading={<div className="muted small">Loading PDF...</div>}
					>
						<Page
							pageNumber={currentPage}
							width={PDF_VIEW_WIDTH}
							onLoadSuccess={onPageLoadSuccess}
							renderTextLayer={false}
							renderAnnotationLayer={false}
						/>
					</Document>
					
					{pageSize && (
						<canvas
							ref={canvasRef}
							onClick={handleCanvasClick}
							width={PDF_VIEW_WIDTH}
							height={pageSize.height * (PDF_VIEW_WIDTH / pageSize.width)}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								cursor: selectedTool ? 'crosshair' : 'default',
								zIndex: 10
							}}
						/>
					)}
				</div>
			</div>

			<div className="viewer-sidebar-list">
				{Array.isArray(annotations.texts) && annotations.texts.filter(a => a.page === currentPage - 1).length > 0 && (
					<div className="ann-group">
						<div className="small muted">Texts on this page</div>
						{annotations.texts.filter(a => a.page === currentPage - 1).map(a => (
							<div key={a.id} className="ann-item">
								<span>{a.text}</span>
								<button onClick={() => deleteAnnotation(a.id, 'texts')}>×</button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
