import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import type { Annotations, TextAnnotation, HighlightAnnotation } from '../lib/annotations'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

const PDF_VIEW_WIDTH = 800; // Standard stable width for coordinate calculation

export default function PdfViewer({
	fileUrl,
	annotations,
	onChange,
}: {
	fileUrl?: string
	annotations: Annotations
	onChange: (next: Annotations) => void
}) {
	const [numPages, setNumPages] = useState<number>(0)
	const [currentPage, setCurrentPage] = useState<number>(1)
	const [selectedTool, setSelectedTool] = useState<'text' | 'highlight' | null>(null)
	const [isDrawing, setIsDrawing] = useState(false)
	const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
	
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null)

	const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
		setNumPages(numPages)
	}

	const onPageLoadSuccess = (page: any) => {
		// Get the actual viewport dimensions at scale 1
		const viewport = page.getViewport({ scale: 1 });
		setPageSize({ width: viewport.width, height: viewport.height });
	}

	const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
		if (!selectedTool || !fileUrl || !pageSize) return

		const canvas = canvasRef.current
		if (!canvas) return

		const rect = canvas.getBoundingClientRect()
		const x = event.clientX - rect.left
		const y = event.clientY - rect.top

		// Convert screen pixels to PDF points
		// width / PDF_VIEW_WIDTH is the scale factor we used in <Page />
		const scale = PDF_VIEW_WIDTH / pageSize.width;
		const pdfX = x / scale;
		const pdfY = (pageSize.height) - (y / scale); // Invert Y for PDF coordinate system (0,0 is bottom-left)

		if (selectedTool === 'text') {
			const text = prompt('Enter text annotation:')
			if (text) {
				const newAnnotation: TextAnnotation = {
					id: crypto.randomUUID(),
					page: currentPage - 1,
					x: pdfX,
					y: pdfY,
					text: text,
				}
				onChange({
					...annotations,
					texts: [...annotations.texts, newAnnotation],
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
					const startY = (pageSize.height) - (Math.max(y, drawStart.y) / scale)
					
					const newAnnotation: HighlightAnnotation = {
						id: crypto.randomUUID(),
						page: currentPage - 1,
						x: startX,
						y: startY,
						width: width,
						height: height,
					}
					onChange({
						...annotations,
						highlights: [...annotations.highlights, newAnnotation],
					})
				}
				setIsDrawing(false)
				setDrawStart(null)
			}
		}
	}

	const deleteAnnotation = (id: string, type: 'texts' | 'highlights') => {
		const next = { ...annotations };
		if (type === 'texts') {
			next.texts = next.texts.filter(a => a.id !== id);
		} else {
			next.highlights = next.highlights.filter(a => a.id !== id);
		}
		onChange(next);
	}

	// Draw annotations on canvas
	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas || !pageSize) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		const scale = PDF_VIEW_WIDTH / pageSize.width;
		
		ctx.clearRect(0, 0, canvas.width, canvas.height)

		// Draw text
		annotations.texts
			.filter(ann => ann.page === currentPage - 1)
			.forEach(ann => {
				const screenX = ann.x * scale;
				const screenY = (pageSize.height - ann.y) * scale;
				ctx.fillStyle = '#ffeb3b';
				ctx.font = 'bold 14px Arial';
				ctx.fillText(ann.text, screenX, screenY);
			})

		// Draw highlights
		annotations.highlights
			.filter(ann => ann.page === currentPage - 1)
			.forEach(ann => {
				const screenX = ann.x * scale;
				const screenY = (pageSize.height - (ann.y + ann.height)) * scale;
				ctx.fillStyle = 'rgba(255, 235, 59, 0.4)';
				ctx.fillRect(screenX, screenY, ann.width * scale, ann.height * scale);
			})

		if (isDrawing && drawStart) {
			ctx.strokeStyle = '#ffeb3b';
			ctx.lineWidth = 1;
			ctx.setLineDash([4, 4]);
		}
	}, [annotations, currentPage, pageSize, isDrawing, drawStart])

	if (!fileUrl) {
		return <div className="viewer-empty">No PDF selected. Upload a PDF first.</div>
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
				
				<div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
					<button className="btn btn-outline" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>←</button>
					<span style={{ fontSize: '14px' }}>{currentPage} / {numPages}</span>
					<button className="btn btn-outline" onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))} disabled={currentPage >= numPages}>→</button>
				</div>
			</div>

			<div ref={containerRef} className="viewer-container">
				<div style={{ position: 'relative', width: PDF_VIEW_WIDTH }}>
					<Document
						file={fileUrl}
						onLoadSuccess={onDocumentLoadSuccess}
						loading={<div className="muted">Loading PDF...</div>}
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
				{annotations.texts.filter(a => a.page === currentPage - 1).length > 0 && (
					<div className="ann-group">
						<div className="small muted">Texts</div>
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