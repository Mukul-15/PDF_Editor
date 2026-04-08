import { useState } from 'react'

export default function UploadPage() {
	const [uploading, setUploading] = useState(false)
	const [uploadedFile, setUploadedFile] = useState(null)

	const handleSubmit = async (e) => {
		e.preventDefault()
		const form = e.currentTarget
		const input = form.elements.namedItem('file')
		const file = input?.files?.[0]
		if (!file) return

		setUploading(true)
		try {
			const formData = new FormData()
			formData.append('file', file)
			
			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			})
			
			if (response.ok) {
				const result = await response.json()
				setUploadedFile(result)
				// Save to localStorage for convenience
				localStorage.setItem('pdf_editor_last_file_id', result.fileId)
				alert(`Uploaded: ${result.filename}`)
			} else {
				alert('Upload failed')
			}
		} catch (error) {
			alert('Upload error: ' + error)
		} finally {
			setUploading(false)
		}
	}

	return (
		<div className="page-center-small">
			<h2 className="h2">Upload PDF</h2>
			<form onSubmit={handleSubmit} className="form-stack">
				<input name="file" type="file" accept="application/pdf" className="input" />
				<button className="btn btn-primary" disabled={uploading}>
					{uploading ? 'Uploading...' : 'Upload'}
				</button>
				{uploadedFile && (
					<div className="status-box">
						<div className="status-success">✅ Uploaded: {uploadedFile.filename}</div>
						<code className="mono">File ID: {uploadedFile.fileId}</code>
						<p className="muted small" style={{ marginTop: 'var(--space-sm)' }}>
							The ID has been saved. You can now go to the Viewer.
						</p>
					</div>
				)}
			</form>
		</div>
	)
}
