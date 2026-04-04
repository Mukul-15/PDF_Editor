import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import './index.css'
import UploadPage from './pages/UploadPage'
import ViewerPage from './pages/ViewerPage'
import DownloadPage from './pages/DownloadPage'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="brand">PDF Editor</Link>
          <nav className="nav">
            <Link to="/upload">Upload</Link>
            <Link to="/viewer">View / Edit</Link>
            <Link to="/download">Download</Link>
          </nav>
        </div>
      </header>
      <main className="container main">
        {children}
      </main>
      <footer className="footer">
        <div className="container footer-inner small">Basic demo for learning - Refactored for industry standards</div>
      </footer>
    </div>
  )
}

function Dashboard() {
  return (
    <div className="grid grid-3">
      <CardLink title="Upload PDF" to="/upload" description="Upload a local PDF to start editing." />
      <CardLink title="View / Edit" to="/viewer" description="Add text and highlights to your PDF." />
      <CardLink title="Download" to="/download" description="Export your annotated PDF as a new file." />
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
