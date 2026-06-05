"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, CheckCircle2, AlertCircle, FolderPlus } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";

interface UploadSectionProps {
  existingFolders: string[];
  onSuccess: () => void;
}

export function UploadSection({ existingFolders, onSuccess }: UploadSectionProps) {
  const { success, error: toastError } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [folder, setFolder] = useState(existingFolders[0] ?? "__new__");
  const [newFolderName, setNewFolderName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleFiles = (files: File[]) => {
    if (files.length === 0) return;
    setSelectedFiles(prev => [...prev, ...files]);

    // Automatically set folder name if a directory was uploaded
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
    setSelectedFiles([]);
    setProgress(0);
    setCurrentFileIndex(0);
    setUploadDone(false);
    setUploadError("");
    setNewFolderName("");
    if (inputRef.current) inputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    const targetFolder = folder === "__new__" ? newFolderName.trim() : folder;
    if (!targetFolder) {
      toastError("Please select or create a folder.");
      return;
    }

    setIsUploading(true);
    setUploadError("");
    setProgress(0);
    setCurrentFileIndex(0);

    let hasError = false;

    for (let i = 0; i < selectedFiles.length; i++) {
      setCurrentFileIndex(i);
      setProgress(0);
      try {
        const file = selectedFiles[i];
        let fileTargetFolder = targetFolder;
        
        // Preserve subdirectories if the file is within a folder structure
        if (file.webkitRelativePath) {
          const parts = file.webkitRelativePath.split("/");
          if (parts.length > 2) {
            const subdirs = parts.slice(1, -1).join("/");
            fileTargetFolder = `${targetFolder}/${subdirs}`;
          }
        }

        await api.uploadFile(file, fileTargetFolder, (pct) => setProgress(pct));
      } catch (e: unknown) {
        const msg = (e as { message?: string })?.message ?? "Upload failed";
        setUploadError(`Failed on ${selectedFiles[i].name}: ${msg}`);
        toastError(`Upload failed on ${selectedFiles[i].name}: ${msg}`);
        hasError = true;
        break;
      }
    }

    if (!hasError) {
      setUploadDone(true);
      success(`${selectedFiles.length} file(s) uploaded successfully!`);
      onSuccess();
      setTimeout(resetState, 2000);
    }
    setIsUploading(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-gray-900">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Upload File(s)
      </h2>

      {selectedFiles.length === 0 ? (
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
            onChange={e => {
              if (e.target.files) handleFiles(Array.from(e.target.files));
            }}
          />
          <input
            ref={folderInputRef}
            type="file"
            {...({ webkitdirectory: "", directory: "" } as any)}
            multiple
            className="hidden"
            onChange={e => {
              if (e.target.files) handleFiles(Array.from(e.target.files));
            }}
          />
          <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
            dragActive ? "bg-indigo-100 dark:bg-indigo-900/40" : "bg-slate-100 dark:bg-slate-800"
          }`}>
            <UploadCloud className={`h-6 w-6 ${dragActive ? "text-indigo-500" : "text-gray-400"}`} />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Drag & drop or{" "}
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              browse files
            </button>
            {" "}or{" "}
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              browse folders
            </button>
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Images, Videos, PDFs, TXT — up to 500 MB
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Selected files */}
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {selectedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <UploadCloud className="h-5 w-5 shrink-0 text-indigo-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white" title={f.webkitRelativePath || f.name}>
                    {f.webkitRelativePath || f.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(f.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {!isUploading && (
                  <button
                    onClick={() => removeFile(i)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {isUploading && currentFileIndex === i && (
                  <span className="text-xs font-semibold text-indigo-500">{progress}%</span>
                )}
                {isUploading && currentFileIndex > i && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-medium text-gray-500">
              {selectedFiles.length} file(s) selected
            </span>
            {!isUploading && (
              <button 
                onClick={() => setSelectedFiles([])}
                className="text-xs text-red-500 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Folder selector */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Destination Folder
            </label>
            <select
              value={folder}
              onChange={e => setFolder(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              disabled={isUploading}
            >
              {existingFolders.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
              <option value="__new__">➕ Create new folder...</option>
            </select>
          </div>

          {folder === "__new__" && (
            <input
              type="text"
              placeholder="New folder name"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              disabled={isUploading}
            />
          )}

          {/* Progress bar */}
          {isUploading && (
            <div>
              <div className="mb-1 flex justify-between text-xs font-medium">
                <span className="text-gray-600 dark:text-gray-400">
                  Uploading {currentFileIndex + 1} of {selectedFiles.length}...
                </span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {Math.round(((currentFileIndex + (progress / 100)) / selectedFiles.length) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-200"
                  style={{ width: `${((currentFileIndex + (progress / 100)) / selectedFiles.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {uploadDone && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Upload complete!</p>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <p className="text-xs font-medium text-red-700 dark:text-red-400">{uploadError}</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={isUploading || uploadDone}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isUploading 
              ? `Uploading...` 
              : uploadDone 
                ? "Done ✓" 
                : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`
            }
          </button>
        </div>
      )}
    </div>
  );
}
