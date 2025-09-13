import { useState } from 'react'
import PdfViewer from '../components/PdfViewer'
import { Annotations, createEmptyAnnotations } from '../lib/annotations'

export default function ViewerPage() {
	const [fileUrl, setFileUrl] = useState<string | undefined>(undefined)
	const [annotations, setAnnotations] = useState<Annotations>(createEmptyAnnotations())

	return (
		<div className="grid gap-4 md:grid-cols-[240px_1fr]">
			<div className="space-y-3">
				<h3 className="font-medium">Tools</h3>
				<input
					type="file"
					accept="application/pdf"
					onChange={(e) => {
						const file = e.target.files?.[0]
						if (!file) return
						const url = URL.createObjectURL(file)
						setFileUrl(url)
					}}
					className="block w-full text-sm"
				/>
				<button
					className="px-3 py-1 rounded border text-sm"
					onClick={() => setAnnotations(createEmptyAnnotations())}
				>
					Clear annotations
				</button>
			</div>
			<div>
				<PdfViewer fileUrl={fileUrl} annotations={annotations} onChange={setAnnotations} />
			</div>
		</div>
	)
}
