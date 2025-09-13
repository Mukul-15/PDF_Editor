import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import type { Annotations, TextAnnotation, HighlightAnnotation } from '../lib/annotations'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

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

	// Handle page load
	const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
		setNumPages(numPages)
	}

	// Handle canvas click for annotations
	const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
		if (!selectedTool || !fileUrl) return

		const canvas = canvasRef.current
		if (!canvas) return

		const rect = canvas.getBoundingClientRect()
		const x = event.clientX - rect.left
		const y = event.clientY - rect.top

		if (selectedTool === 'text') {
			const text = prompt('Enter text annotation:')
			if (text) {
				const newAnnotation: TextAnnotation = {
					id: crypto.randomUUID(),
					page: currentPage - 1,
					x: x,
					y: y,
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
				// Finish highlight
				if (drawStart) {
					const width = Math.abs(x - drawStart.x)
					const height = Math.abs(y - drawStart.y)
					const newAnnotation: HighlightAnnotation = {
						id: crypto.randomUUID(),
						page: currentPage - 1,
						x: Math.min(x, drawStart.x),
						y: Math.min(y, drawStart.y),
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

	// Draw annotations on canvas
	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height)

		// Draw text annotations for current page
		annotations.texts
			.filter(ann => ann.page === currentPage - 1)
			.forEach(ann => {
				ctx.fillStyle = '#ffeb3b'
				ctx.font = '12px Arial'
				ctx.fillText(ann.text, ann.x, ann.y)
			})

		// Draw highlight annotations for current page
		annotations.highlights
			.filter(ann => ann.page === currentPage - 1)
			.forEach(ann => {
				ctx.fillStyle = 'rgba(255, 235, 59, 0.3)'
				ctx.fillRect(ann.x, ann.y, ann.width, ann.height)
			})

		// Draw current highlight being drawn
		if (isDrawing && drawStart) {
			ctx.strokeStyle = '#ffeb3b'
			ctx.lineWidth = 2
			ctx.setLineDash([5, 5])
			ctx.strokeRect(drawStart.x, drawStart.y, 0, 0)
		}
	}, [annotations, currentPage, isDrawing, drawStart])

	// Update canvas size when page changes
	useEffect(() => {
		const canvas = canvasRef.current
		const container = containerRef.current
		if (!canvas || !container) return

		const updateCanvasSize = () => {
			const rect = container.getBoundingClientRect()
			canvas.width = rect.width
			canvas.height = rect.height
		}

		updateCanvasSize()
		window.addEventListener('resize', updateCanvasSize)
		return () => window.removeEventListener('resize', updateCanvasSize)
	}, [currentPage])

	if (!fileUrl) {
		return (
			<div style={{ 
				display: 'flex', 
				alignItems: 'center', 
				justifyContent: 'center', 
				height: '100%',
				color: '#b0b0b0',
				fontSize: '1.1rem'
			}}>
				No PDF selected. Upload a PDF first.
			</div>
		)
	}

	return (
		<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			{/* Toolbar */}
			<div style={{ 
				padding: '12px', 
				borderBottom: '1px solid #444',
				display: 'flex',
				gap: '8px',
				alignItems: 'center'
			}}>
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
				{selectedTool && (
					<button
						className="btn btn-outline"
						onClick={() => setSelectedTool(null)}
					>
						Cancel
					</button>
				)}
				<div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
					<button
						className="btn btn-outline"
						onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
						disabled={currentPage <= 1}
					>
						←
					</button>
					<span style={{ fontSize: '14px', color: '#b0b0b0' }}>
						{currentPage} / {numPages}
					</span>
					<button
						className="btn btn-outline"
						onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
						disabled={currentPage >= numPages}
					>
						→
					</button>
				</div>
			</div>

			{/* PDF Viewer */}
			<div 
				ref={containerRef}
				style={{ 
					flex: 1, 
					position: 'relative', 
					overflow: 'auto',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'flex-start',
					padding: '20px'
				}}
			>
				<div style={{ position: 'relative' }}>
					<Document
						file={fileUrl}
						onLoadSuccess={onDocumentLoadSuccess}
						loading={<div style={{ color: '#b0b0b0' }}>Loading PDF...</div>}
						error={<div style={{ color: '#ff6b6b' }}>Error loading PDF</div>}
					>
						<Page
							pageNumber={currentPage}
							width={600}
							renderTextLayer={false}
							renderAnnotationLayer={false}
						/>
					</Document>
					
					{/* Annotation Canvas Overlay */}
					<canvas
						ref={canvasRef}
						onClick={handleCanvasClick}
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							height: '100%',
							cursor: selectedTool ? 'crosshair' : 'default',
							zIndex: 10
						}}
					/>
				</div>
			</div>

			{/* Instructions */}
			{selectedTool && (
				<div style={{ 
					padding: '12px', 
					background: '#2a2a2a', 
					borderTop: '1px solid #444',
					fontSize: '14px',
					color: '#b0b0b0'
				}}>
					{selectedTool === 'text' ? 'Click on the PDF to add text annotation' : 'Click and drag to create highlight'}
				</div>
			)}
		</div>
	)
}