import { useState, useEffect } from 'react'
import PdfViewer from '../components/PdfViewer'
import type { Annotations } from '../lib/annotations'
import { createEmptyAnnotations } from '../lib/annotations'

export default function ViewerPage() {
	const [fileUrl, setFileUrl] = useState<string | undefined>(undefined)
	const [annotations, setAnnotations] = useState<Annotations>(createEmptyAnnotations())
	const [fileId, setFileId] = useState('')
	const [loading, setLoading] = useState(false)

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
		if (!fileId) return

		const saveAnnotations = async () => {
			try {
				await fetch(`/api/annotations/${fileId}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(annotations)
				})
			} catch (error) {
				console.error('Failed to save annotations:', error)
			}
		}

		saveAnnotations()
	}, [annotations, fileId])

	const handleFileSelect = async () => {
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
				<h3 className="h2">Load PDF</h3>
				<div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
					<input
						type="text"
						placeholder="Enter File ID"
						value={fileId}
						onChange={(e) => setFileId(e.target.value)}
						className="input"
					/>
					<button
						className="btn btn-primary"
						onClick={handleFileSelect}
						disabled={loading}
					>
						{loading ? 'Loading...' : 'Load PDF'}
					</button>
				</div>

				<h3 className="h2">Tools</h3>
				<div className="tools">
					<p style={{ fontSize: '14px', color: '#b0b0b0', marginBottom: '12px' }}>
						Select a tool and click on the PDF to add annotations
					</p>
					<div style={{ fontSize: '12px', color: '#777' }}>
						<p><strong>Text:</strong> Click to add text notes</p>
						<p><strong>Highlight:</strong> Click and drag to highlight</p>
					</div>
				</div>

				{annotations.texts.length > 0 || annotations.highlights.length > 0 ? (
					<div style={{ marginTop: '24px' }}>
						<h4 className="h3">Annotations</h4>
						<div style={{ fontSize: '12px', color: '#b0b0b0' }}>
							<p>Texts: {annotations.texts.length}</p>
							<p>Highlights: {annotations.highlights.length}</p>
						</div>
					</div>
				) : null}
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