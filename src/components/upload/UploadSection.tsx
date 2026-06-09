"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";

interface UploadSectionProps {
  existingFolders: string[];
  onSuccess: () => void;
}

interface FileStatus {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  progress: number;
}

export function UploadSection({ existingFolders, onSuccess }: UploadSectionProps) {
  const { success, error: toastError } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [fileList, setFileList] = useState<FileStatus[]>([]);
  const [folder, setFolder] = useState(existingFolders[0] ?? "__new__");
  const [newFolderName, setNewFolderName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [summary, setSummary] = useState<{ ok: number; fail: number } | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleFiles = (files: File[]) => {
    if (files.length === 0) return;
    const newItems: FileStatus[] = files.map(f => ({ file: f, status: "pending", progress: 0 }));
    setFileList(prev => [...prev, ...newItems]);

    // Auto-set folder from directory upload
    const firstPath = files[0].webkitRelativePath;
    if (firstPath) {
      const parts = firstPath.split("/");
      if (parts.length > 1) {
        setFolder("__new__");
        setNewFolderName(parts[0]);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const resetState = () => {
    setFileList([]);
    setUploadDone(false);
    setSummary(null);
    setNewFolderName("");
    if (inputRef.current) inputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFileList(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (fileList.length === 0) return;
    const targetFolder = folder === "__new__" ? newFolderName.trim() : folder;
    if (!targetFolder) {
      toastError("Please select or create a folder.");
      return;
    }

    setIsUploading(true);
    setUploadDone(false);
    setSummary(null);

    // Snapshot the list so we iterate the same items throughout
    const snapshot = fileList;
    let successCount = 0;

    for (let i = 0; i < snapshot.length; i++) {
      // Mark this file as uploading
      setFileList(prev =>
        prev.map((item, idx) => idx === i ? { ...item, status: "uploading" } : item)
      );

      try {
        const item = snapshot[i];
        let fileTargetFolder = targetFolder;

        // Preserve sub-directory structure for folder uploads
        if (item.file.webkitRelativePath) {
          const parts = item.file.webkitRelativePath.split("/");
          if (parts.length > 2) {
            fileTargetFolder = `${targetFolder}/${parts.slice(1, -1).join("/")}`;
          }
        }

        await api.uploadFile(item.file, fileTargetFolder, (pct) => {
          setFileList(prev =>
            prev.map((f, idx) => idx === i ? { ...f, progress: pct } : f)
          );
        });

        // Mark success
        setFileList(prev =>
          prev.map((f, idx) => idx === i ? { ...f, status: "success", progress: 100 } : f)
        );
        successCount++;
      } catch (e: any) {
        // Mark error — do NOT break; continue with remaining files
        setFileList(prev =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "error", error: e.message || "Upload failed" } : f
          )
        );
      }
    }

    const failCount = snapshot.length - successCount;
    setUploadDone(true);
    setIsUploading(false);
    setSummary({ ok: successCount, fail: failCount });

    if (successCount > 0) onSuccess();

    if (failCount === 0) {
      success(`All ${successCount} file(s) uploaded successfully!`);
      setTimeout(resetState, 2500);
    } else if (successCount === 0) {
      toastError(`All ${failCount} file(s) failed to upload.`);
    } else {
      toastError(`${failCount} file(s) failed — ${successCount} uploaded successfully.`);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-gray-900">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Upload File(s)
      </h2>

      {fileList.length === 0 ? (
        /* ── Drop zone ── */
        <div
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
            dragActive
              ? "border-indigo-500 bg-indigo-50 dark:border-indigo-500/60 dark:bg-indigo-950/20"
              : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-indigo-700 dark:hover:bg-slate-800/30"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={e => e.target.files && handleFiles(Array.from(e.target.files))}
          />
          <input
            ref={folderInputRef}
            type="file"
            {...({ webkitdirectory: "", directory: "" } as any)}
            multiple
            className="hidden"
            onChange={e => e.target.files && handleFiles(Array.from(e.target.files))}
          />
          <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
            dragActive ? "bg-indigo-100 dark:bg-indigo-900/40" : "bg-slate-100 dark:bg-slate-800"
          }`}>
            <UploadCloud className={`h-6 w-6 ${dragActive ? "text-indigo-500" : "text-gray-400"}`} />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Drag &amp; drop or{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              browse files
            </button>
            {" "}or{" "}
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              browse folders
            </button>
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Images, Videos, PDFs, Code files — up to 500 MB each
          </p>
        </div>
      ) : (
        /* ── File list + controls ── */
        <div className="space-y-4">

          {/* Per-file status list */}
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {fileList.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                  item.status === "success"
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/20"
                    : item.status === "error"
                    ? "border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-950/20"
                    : item.status === "uploading"
                    ? "border-indigo-200 bg-indigo-50 dark:border-indigo-800/40 dark:bg-indigo-950/20"
                    : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
                }`}
              >
                <UploadCloud className={`h-5 w-5 shrink-0 ${
                  item.status === "success" ? "text-emerald-500" :
                  item.status === "error"   ? "text-red-400" :
                  "text-indigo-500"
                }`} />

                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-medium text-gray-900 dark:text-white"
                    title={item.file.webkitRelativePath || item.file.name}
                  >
                    {item.file.webkitRelativePath || item.file.name}
                  </p>
                  {item.status === "error" && item.error ? (
                    <p className="truncate text-xs text-red-500 dark:text-red-400" title={item.error}>
                      {item.error}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>

                {/* Right-side indicator */}
                {item.status === "uploading" && (
                  <span className="shrink-0 text-xs font-semibold text-indigo-500">
                    {Math.round(item.progress)}%
                  </span>
                )}
                {item.status === "success" && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                )}
                {item.status === "error" && (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                )}
                {item.status === "pending" && !isUploading && (
                  <button
                    onClick={() => removeFile(i)}
                    className="rounded-lg p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* File count + clear */}
          {!isUploading && !uploadDone && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-medium text-gray-500">
                {fileList.length} file(s) selected
              </span>
              <button
                onClick={resetState}
                className="text-xs text-red-500 hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Folder selector — shown only before upload */}
          {!isUploading && !uploadDone && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Destination Folder
              </label>
              <select
                value={folder}
                onChange={e => setFolder(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {existingFolders.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
                <option value="__new__">➕ Create new folder...</option>
              </select>
              {folder === "__new__" && (
                <input
                  type="text"
                  placeholder="New folder name"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              )}
            </div>
          )}

          {/* Overall progress bar (pulse while uploading) */}
          {isUploading && (
            <div>
              <div className="mb-1 flex justify-between text-xs font-medium">
                <span className="text-gray-600 dark:text-gray-400">
                  Uploading… {fileList.filter(f => f.status === "success" || f.status === "error").length} / {fileList.length}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {Math.round(
                    (fileList.filter(f => f.status === "success" || f.status === "error").length /
                      fileList.length) * 100
                  )}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                  style={{
                    width: `${
                      (fileList.filter(f => f.status === "success" || f.status === "error").length /
                        fileList.length) * 100
                    }%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Summary banner after completion */}
          {uploadDone && summary && (
            summary.fail === 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800/40 dark:bg-emerald-950/20">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  All {summary.ok} file(s) uploaded successfully!
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800/40 dark:bg-amber-950/20">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {summary.ok > 0
                    ? `${summary.ok} uploaded, ${summary.fail} failed — see red items above.`
                    : `All ${summary.fail} file(s) failed to upload.`}
                </p>
              </div>
            )
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {!uploadDone && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-indigo-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploading
                  ? `Uploading…`
                  : `Upload ${fileList.length} File${fileList.length !== 1 ? "s" : ""}`}
              </button>
            )}
            {uploadDone && (
              <button
                onClick={resetState}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800"
              >
                Upload More Files
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
