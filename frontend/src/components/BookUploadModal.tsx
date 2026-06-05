"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";

interface BookUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Stage = "drop" | "confirm" | "ingesting" | "done" | "error";

export default function BookUploadModal({ onClose, onSuccess }: BookUploadModalProps) {
  const [stage, setStage] = useState<Stage>("drop");
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function loadFile(file: File) {
    if (!file.name.endsWith(".txt")) {
      setErrorMsg("Only .txt files are supported.");
      setStage("error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content);
      setTitle(file.name.replace(/\.txt$/i, ""));
      setStage("confirm");
    };
    reader.readAsText(file);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }

  function onFileInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  }

  async function handleIngest() {
    if (!title.trim() || !author.trim()) return;
    setStage("ingesting");
    try {
      const res = await fetch("http://localhost:8000/books/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, text }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail ?? `Error ${res.status}`);
      }
      setStage("done");
      onSuccess();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Ingestion failed");
      setStage("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Add a Book</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">×</button>
        </div>

        {/* Drop stage */}
        {stage === "drop" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
              dragging ? "border-zinc-500 bg-zinc-50" : "border-zinc-300 hover:border-zinc-400"
            }`}
          >
            <div className="text-4xl">📄</div>
            <p className="text-sm font-medium text-zinc-700">Drop a .txt file here</p>
            <p className="text-xs text-zinc-400">or click to browse</p>
            <input ref={inputRef} type="file" accept=".txt" className="hidden" onChange={onFileInput} />
          </div>
        )}

        {/* Confirm stage */}
        {stage === "confirm" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">Author</label>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Jane Austen"
                className="px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300"
              />
            </div>
            <p className="text-xs text-zinc-400">
              {text.split(/\s+/).length.toLocaleString()} words · will be split into ~{Math.ceil(text.split(/\s+/).length / 400)} chunks
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setStage("drop")}
                className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleIngest}
                disabled={!title.trim() || !author.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium disabled:opacity-50 hover:bg-zinc-700 transition-colors"
              >
                Ingest Book
              </button>
            </div>
          </div>
        )}

        {/* Ingesting stage */}
        {stage === "ingesting" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-800 rounded-full animate-spin" />
            <p className="text-sm text-zinc-600">Ingesting <span className="font-medium">{title}</span>…</p>
            <p className="text-xs text-zinc-400">Chunking and embedding — this may take a minute</p>
          </div>
        )}

        {/* Done stage */}
        {stage === "done" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="text-4xl">✅</div>
            <p className="text-sm font-medium text-zinc-800">{title} ingested successfully</p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* Error stage */}
        {stage === "error" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-sm text-red-600">{errorMsg}</p>
            <button
              onClick={() => setStage("drop")}
              className="px-4 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
