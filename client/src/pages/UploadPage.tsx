import { useState } from 'react'

export default function UploadPage() {
	const [uploading, setUploading] = useState(false)
	const [uploadedFile, setUploadedFile] = useState<{fileId: string, filename: string} | null>(null)

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const form = e.currentTarget
		const input = form.elements.namedItem('file') as HTMLInputElement
		const file = input.files?.[0]
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
		<div style={{ maxWidth: 560 }}>
			<h2 className="h2">Upload PDF</h2>
			<form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
				<input name="file" type="file" accept="application/pdf" className="input" />
				<button className="btn btn-primary" disabled={uploading}>
					{uploading ? 'Uploading...' : 'Upload'}
				</button>
				{uploadedFile && (
					<div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '14px' }}>
						<div style={{ color: '#4caf50', fontWeight: 'bold', marginBottom: '4px' }}>✅ Uploaded: {uploadedFile.filename}</div>
						<code>File ID: {uploadedFile.fileId}</code>
						<p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--muted)' }}>
							The ID has been saved. You can now go to the Viewer.
						</p>
					</div>
				)}
			</form>
		</div>
	)
}
