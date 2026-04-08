import { useState, useEffect } from 'react'

export default function DownloadPage() {
	const [fileId, setFileId] = useState('')
	const [downloading, setDownloading] = useState(false)

	useEffect(() => {
		const lastId = localStorage.getItem('pdf_editor_last_file_id')
		if (lastId) setFileId(lastId)
	}, [])

	const handleDownload = async () => {
		if (!fileId.trim()) {
			alert('Please enter a file ID')
			return
		}

		setDownloading(true)
		try {
			const response = await fetch(`/api/export/${fileId}`)
			if (response.ok) {
				const blob = await response.blob()
				const url = window.URL.createObjectURL(blob)
				const a = document.createElement('a')
				a.href = url
				a.download = `annotated-${fileId}.pdf`
				document.body.appendChild(a)
				a.click()
				window.URL.revokeObjectURL(url)
				document.body.removeChild(a)
			} else {
				alert('Download failed - file not found')
			}
		} catch (error) {
			alert('Download error: ' + error)
		} finally {
			setDownloading(false)
		}
	}

	return (
		<div className="page-center-small">
			<h2 className="h2">Download Annotated PDF</h2>
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
					onClick={handleDownload}
					disabled={downloading}
				>
					{downloading ? 'Downloading...' : 'Download PDF'}
				</button>
				<div className="status-box">
					<h3 className="h3">Instructions</h3>
					<ol className="small muted" style={{ marginLeft: 'var(--space-md)' }}>
						<li>Upload a PDF first</li>
						<li>Copy the File ID from the upload confirmation</li>
						<li>Paste it here and click Download</li>
					</ol>
				</div>
			</div>
		</div>
	)
}
