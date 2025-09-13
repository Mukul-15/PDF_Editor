import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
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
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements.namedItem('file') as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    alert(`Selected: ${file.name}`)
  }
  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
      <input name="file" type="file" accept="application/pdf" className="input" />
      <button className="btn btn-primary">Upload</button>
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
  return (
    <div>
      <h2 className="h2">Download Annotated PDF</h2>
      <button className="btn btn-primary">Download</button>
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
