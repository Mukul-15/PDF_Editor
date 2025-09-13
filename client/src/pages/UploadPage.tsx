export default function UploadPage() {
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const form = e.currentTarget
		const input = form.elements.namedItem('file') as HTMLInputElement
		const file = input.files?.[0]
		if (!file) return
		alert(`Selected: ${file.name}`)
	}
	return (
		<div className="max-w-lg">
			<h2 className="text-xl font-semibold mb-4">Upload PDF</h2>
			<form onSubmit={handleSubmit} className="space-y-3">
				<input name="file" type="file" accept="application/pdf" className="block w-full" />
				<button className="inline-flex items-center rounded-md bg-black text-white px-4 py-2 text-sm">Upload</button>
			</form>
		</div>
	)
}
