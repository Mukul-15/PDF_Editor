# 📄 Full-Stack PDF Editor (Refactored)

A professional full-stack **PDF Editor** application designed for industry-level performance and stability. Featuring a **Vite/React/TypeScript** frontend and a modular **Node.js/Express** backend with **JSON-based persistence**.

---

## ✨ Features
- 🔼 **Reliable Uploads** – Secure PDF uploading via `multer` with MIME type validation.
- 🖊️ **Interactive Annotations** – Add **Text** and **Highlights** directly on the PDF through a responsive canvas.
- 💾 **JSON Persistence** – Annotations are saved to `server/data/annotations.json` (no more data loss on restart!).
- 🎯 **Coordinate-Perfect Export** – High-accuracy translation from screen pixels to PDF points (origin-normalized) for the final export.
- 📤 **PDF Export** – Download the modified PDF with your annotations permanently embedded.
- 🌗 **Premium Dark UI** – Modern, glassmorphism-inspired design with custom CSS variables and smooth transitions.
- 🔄 **Stateful Workflow** – Uses `localStorage` to remember your last project ID.

---

## 🛠️ Tech Stack
- **Frontend**: 
  - [React](https://reactjs.org/) (Vite)
  - [TypeScript](https://www.typescriptlang.org/)
  - [react-pdf](https://projects.wojtekmaj.pl/react-pdf/) (PDF Rendering)
  - [react-router-dom](https://reactrouter.com/) (Navigation)
- **Backend**:
  - [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
  - [pdf-lib](https://pdf-lib.js.org/) (PDF Manipulation)
  - [multer](https://github.com/expressjs/multer) (File Handling)
  - [uuid](https://github.com/uuidjs/uuid) (ID Generation)

---

## 📂 Folder Structure

```
├── client/              # React Frontend (Vite)
│   ├── src/
│   │   ├── components/  # Core UI components (PdfViewer)
│   │   ├── pages/       # Page views (Upload, Viewer, Download)
│   │   ├── lib/         # Type definitions and utilities
│   │   └── App.tsx      # Main routing and layout
├── server/              # Node.js Backend
│   ├── src/
│   │   ├── app.js       # Express configuration and routes
│   │   ├── storage.js   # JSON-based data persistence
│   │   └── services/    # PDF processing logic (pdfService)
│   ├── index.js         # Entry point (handles Vite dev server)
│   ├── uploads/         # Directory for uploaded PDFs
│   └── data/            # Local JSON data storage
└── README.md
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
# In the root, client, and server directories
cd client && npm install
cd ../server && npm install
```

### 2. Run the Application
In development mode, the server integrates with the Vite dev server for an all-in-one experience.

```bash
# Start the full-stack app from the server directory
cd server
npm start
```
The app will be available at: **http://localhost:4000**

---

## 🧪 Verification & Testing
1. **Upload**: Use the `Upload` tab to select a PDF.
2. **Annotate**: Load the file in the `Viewer` tab and add some notes/highlights.
3. **Verify**: Close and reopen the tab; notice your annotations are still there (via JSON persistence).
4. **Export**: Use the `Download` tab to get the final PDF and verify the alignment.
