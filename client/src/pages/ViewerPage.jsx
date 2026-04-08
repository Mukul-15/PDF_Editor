import { useState, useEffect } from 'react'
import PdfViewer from '../components/PdfViewer'
import { createEmptyAnnotations } from '../lib/annotations'

export default function ViewerPage() {
	const [fileUrl, setFileUrl] = useState(undefined)
	const [annotations, setAnnotations] = useState(createEmptyAnnotations())
	const [fileId, setFileId] = useState('')
	const [loading, setLoading] = useState(false)

	// Auto-load from localStorage on mount
	useEffect(() => {
		const lastId = localStorage.getItem('pdf_editor_last_file_id')
		if (lastId) {
			setFileId(lastId)
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
				<div className="sidebar-section">
					<h3 className="h3">Load Project</h3>
					<div className="form-stack">
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

				<div className="sidebar-section">
					<h3 className="h3">Instructions</h3>
					<p className="small muted">
						1. Select a tool above the PDF.<br/>
						2. Click to add text.<br/>
						3. Click twice and drag to highlight.
					</p>
				</div>

				{fileId && (
					<div className="mt-auto">
						<button 
							className="btn btn-outline btn-error" 
							style={{ width: '100%' }}
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
			<div className="viewer-window">
				<PdfViewer
					fileUrl={fileUrl}
					annotations={annotations}
					onChange={setAnnotations}
				/>
			</div>
		</div>
	)
}
