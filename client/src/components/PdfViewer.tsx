import { useEffect, useRef, useState } from 'react'
import { Annotations, TextAnnotation, HighlightAnnotation } from '../lib/annotations'

// Placeholder viewer until react-pdf is installed
export default function PdfViewer({
	fileUrl,
	annotations,
	onChange,
}: {
	fileUrl?: string
	annotations: Annotations
	onChange: (next: Annotations) => void
}) {
	const [tool, setTool] = useState<'text' | 'highlight' | null>(null)
	const containerRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		if (!containerRef.current) return
		const el = containerRef.current
		const handleClick = (e: MouseEvent) => {
			if (!tool) return
			const rect = el.getBoundingClientRect()
			const x = e.clientX - rect.left
			const y = rect.height - (e.clientY - rect.top)
			if (tool === 'text') {
				const t: TextAnnotation = { id: crypto.randomUUID(), page: 0, x, y, text: 'Note' }
				onChange({ ...annotations, texts: [...annotations.texts, t] })
			}
			if (tool === 'highlight') {
				const h: HighlightAnnotation = { id: crypto.randomUUID(), page: 0, x, y, width: 120, height: 18 }
				onChange({ ...annotations, highlights: [...annotations.highlights, h] })
			}
		}
		el.addEventListener('click', handleClick)
		return () => el.removeEventListener('click', handleClick)
	}, [tool, annotations, onChange])

	return (
		<div className="space-y-2">
			<div className="flex gap-2">
				<button onClick={() => setTool('text')} className={`px-3 py-1 rounded border ${tool==='text' ? 'bg-black text-white' : ''}`}>Text</button>
				<button onClick={() => setTool('highlight')} className={`px-3 py-1 rounded border ${tool==='highlight' ? 'bg-black text-white' : ''}`}>Highlight</button>
				<button onClick={() => setTool(null)} className="px-3 py-1 rounded border">Select</button>
			</div>
			<div ref={containerRef} className="relative border bg-white rounded h-[70vh] overflow-hidden">
				{/* Simulated PDF page area */}
				<div className="absolute inset-0 grid place-items-center text-gray-400">
					{fileUrl ? 'PDF preview (install react-pdf to enable rendering)' : 'No PDF loaded'}
				</div>
				{annotations.highlights.map(h => (
					<div key={h.id} style={{ left: h.x, bottom: h.y, width: h.width, height: h.height }} className="absolute bg-yellow-300/50 pointer-events-none" />
				))}
				{annotations.texts.map(t => (
					<div key={t.id} style={{ left: t.x, bottom: t.y }} className="absolute text-sm text-black bg-yellow-50/80 px-1 rounded">
						{t.text}
					</div>
				))}
			</div>
		</div>
	)
}
