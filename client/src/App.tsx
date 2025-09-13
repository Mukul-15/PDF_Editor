import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { useState } from 'react'
import './index.css'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="brand">PDF Editor</Link>
          <nav className="nav">
            <Link to="/upload">Upload PDF</Link>
            <Link to="/viewer">View / Edit</Link>
            <Link to="/download">Download</Link>
          </nav>
        </div>
      </header>
      <main className="container main">
        {children}
      </main>
      <footer className="footer">
        <div className="container footer-inner small">Basic demo for learning</div>
      </footer>
    </div>
  )
}

function Dashboard() {
  return (
    <div className="grid grid-3">
      <CardLink title="Upload PDF" to="/upload" description="Upload a local PDF to edit." />
      <CardLink title="View / Edit" to="/viewer" description="Open the current PDF and add annotations." />
      <CardLink title="Download" to="/download" description="Export the annotated PDF." />
    </div>
  )
}

function CardLink({ title, description, to }: { title: string; description: string; to: string }) {
  return (
    <Link to={to} className="card">
      <div className="card-title">{title}</div>
      <div className="card-desc">{description}</div>
    </Link>
  )
}

function UploadPage() {
  return (
    <div style={{ maxWidth: 560 }}>
      <h2 className="h2">Upload PDF</h2>
      <UploadForm />
    </div>
  )
}

function UploadForm() {
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
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
      <input name="file" type="file" accept="application/pdf" className="input" />
      <button className="btn btn-primary" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      {uploadedFile && (
        <div style={{ padding: '12px', background: '#2a2a2a', borderRadius: '6px', fontSize: '14px' }}>
          ✅ Uploaded: {uploadedFile.filename}
          <br />
          <small>File ID: {uploadedFile.fileId}</small>
        </div>
      )}
    </form>
  )
}

function ViewerPage() {
  return (
    <div className="viewer-layout">
      <div className="sidebar">
        <h3 className="h2">Tools</h3>
        <div className="tools">
          <button className="btn btn-outline">Text</button>
          <button className="btn btn-outline">Highlight</button>
        </div>
      </div>
      <div className="viewer">
        PDF Viewer placeholder (react-pdf)
      </div>
    </div>
  )
}

function DownloadPage() {
  const [fileId, setFileId] = useState('')
  const [downloading, setDownloading] = useState(false)

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
    <div style={{ maxWidth: 560 }}>
      <h2 className="h2">Download Annotated PDF</h2>
      <div style={{ display: 'grid', gap: 12 }}>
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
          {downloading ? 'Downloading...' : 'Download'}
        </button>
        <div style={{ fontSize: '14px', color: '#b0b0b0' }}>
          <p>To get a File ID:</p>
          <ol style={{ marginLeft: '20px' }}>
            <li>Upload a PDF first</li>
            <li>Copy the File ID from the upload confirmation</li>
            <li>Paste it here and click Download</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/viewer" element={<ViewerPage />} />
          <Route path="/download" element={<DownloadPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
