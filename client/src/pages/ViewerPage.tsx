import { useState, useEffect } from 'react'
import PdfViewer from '../components/PdfViewer'
import type { Annotations } from '../lib/annotations'
import { createEmptyAnnotations } from '../lib/annotations'

export default function ViewerPage() {
	const [fileUrl, setFileUrl] = useState<string | undefined>(undefined)
	const [annotations, setAnnotations] = useState<Annotations>(createEmptyAnnotations())
	const [fileId, setFileId] = useState('')
	const [loading, setLoading] = useState(false)

	// Auto-load from localStorage on mount
	useEffect(() => {
		const lastId = localStorage.getItem('pdf_editor_last_file_id')
		if (lastId) {
			setFileId(lastId)
			// We don't auto-load the PDF bytes to avoid heavy initial load, 
			// but we could if the user prefers. For now, they click "Load".
		}
	}, [])

	// Load annotations when fileId changes
	useEffect(() => {
		if (!fileId) return

		const loadAnnotations = async () => {
			try {
				const response = await fetch(`/api/annotations/${fileId}`)
				if (response.ok) {
					const data = await response.json()
					setAnnotations(data)
				}
			} catch (error) {
				console.error('Failed to load annotations:', error)
			}
		}

		loadAnnotations()
	}, [fileId])

	// Save annotations when they change
	// Debouncing would be better here for production
	useEffect(() => {
		if (!fileId || !fileUrl) return

		const timer = setTimeout(async () => {
			try {
				await fetch(`/api/annotations/${fileId}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(annotations)
				})
			} catch (error) {
				console.error('Failed to save annotations:', error)
			}
		}, 1000)

		return () => clearTimeout(timer)
	}, [annotations, fileId, fileUrl])

	const handleFileLoad = async () => {
		if (!fileId.trim()) {
			alert('Please enter a file ID')
			return
		}

		setLoading(true)
		try {
			const response = await fetch(`/api/file/${fileId}`)
			if (response.ok) {
				const blob = await response.blob()
				const url = URL.createObjectURL(blob)
				setFileUrl(url)
				localStorage.setItem('pdf_editor_last_file_id', fileId)
			} else {
				alert('File not found')
			}
		} catch (error) {
			alert('Error loading file: ' + error)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="viewer-layout">
			<div className="sidebar">
				<div>
					<h3 className="h3">Load Project</h3>
					<div style={{ display: 'grid', gap: '8px' }}>
						<input
							type="text"
							placeholder="Enter File ID"
							value={fileId}
							onChange={(e) => setFileId(e.target.value)}
							className="input"
						/>
						<button
							className="btn btn-primary"
							onClick={handleFileLoad}
							disabled={loading}
						>
							{loading ? 'Loading...' : 'Load PDF'}
						</button>
					</div>
				</div>

				<div className="tools">
					<h3 className="h3">Instructions</h3>
					<p style={{ fontSize: '12px', color: 'var(--muted)' }}>
						1. Select a tool above the PDF.<br/>
						2. Click to add text.<br/>
						3. Click twice to create a highlight.
					</p>
				</div>

				{fileId && (
					<div style={{ marginTop: 'auto' }}>
						<button 
							className="btn btn-outline" 
							style={{ width: '100%', color: '#ff6b6b' }}
							onClick={async () => {
								if (confirm('Clear all annotations?')) {
									await fetch(`/api/annotations/${fileId}`, { method: 'DELETE' })
									setAnnotations(createEmptyAnnotations())
								}
							}}
						>
							Clear All
						</button>
					</div>
				)}
			</div>
			<div className="viewer">
				<PdfViewer
					fileUrl={fileUrl}
					annotations={annotations}
					onChange={setAnnotations}
				/>
			</div>
		</div>
	)
}