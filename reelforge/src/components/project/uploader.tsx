"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatBytes } from "@/lib/utils";

// Drag-and-drop video uploader. Posts to the upload API route, which stores the
// file and kicks off processing; then we refresh so the page shows progress.

export function Uploader({ projectId }: { projectId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function pick(f: File | null) {
    setError(null);
    if (f && !f.type.startsWith("video/")) {
      setError("Please choose a video file.");
      return;
    }
    setFile(f);
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    const body = new FormData();
    body.append("file", file);

    // Use XHR for upload progress.
    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/projects/${projectId}/upload`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          try {
            setError(JSON.parse(xhr.responseText).error || "Upload failed");
          } catch {
            setError("Upload failed");
          }
          setUploading(false);
          resolve();
        }
      };
      xhr.onerror = () => {
        setError("Network error during upload");
        setUploading(false);
        resolve();
      };
      xhr.send(body);
    });

    if (!error) router.refresh();
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pick(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        className={`card flex cursor-pointer flex-col items-center justify-center border-2 border-dashed py-14 text-center transition ${
          dragOver ? "border-brand-500 bg-brand-500/5" : "border-white/10"
        }`}
      >
        <div className="text-4xl">⬆️</div>
        <p className="mt-3 font-semibold text-white">
          Drag & drop your video, or click to browse
        </p>
        <p className="mt-1 text-xs text-ink-400">
          MP4, MOV, or WebM. One long recording works best.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
      </div>

      {file && (
        <div className="card mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">{file.name}</p>
              <p className="text-xs text-ink-400">{formatBytes(file.size)}</p>
            </div>
            {!uploading && (
              <button onClick={upload} className="btn-primary">
                Upload & process
              </button>
            )}
          </div>
          {uploading && (
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-ink-800">
                <div
                  className="h-full bg-brand-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-ink-400">
                {progress < 100 ? `Uploading… ${progress}%` : "Starting AI processing…"}
              </p>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
