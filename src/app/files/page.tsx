"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { FileGrid } from "@/components/files/FileGrid";
import { FolderView } from "@/components/files/FolderView";
import { FilePreviewModal } from "@/components/files/FilePreviewModal";
import { ShareModal } from "@/components/files/ShareModal";
import { RenameModal } from "@/components/files/RenameModal";
import { MoveModal } from "@/components/files/MoveModal";
import { api, FileData } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";
import { LayoutGrid, List, Trash2, Filter } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function FilesPage() {
  const { success, error: toastError } = useToast();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q")?.toLowerCase() || "";

  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string>("all");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Modals
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);
  const [shareFile, setShareFile] = useState<FileData | null>(null);
  const [renameFile, setRenameFile] = useState<FileData | null>(null);
  const [moveFile, setMoveFile] = useState<FileData | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const filesData = await api.getFiles();
      setFiles(filesData);
    } catch (err) {
      toastError("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute folders
  const foldersMap = new Map<string, number>();
  files.forEach(f => {
    foldersMap.set(f.folder, (foldersMap.get(f.folder) || 0) + 1);
  });
  const foldersList = Array.from(foldersMap.entries()).map(([name, count]) => ({ name, count }));

  // Filter files
  let filteredFiles = files;
  if (activeFolder) filteredFiles = filteredFiles.filter(f => f.folder === activeFolder);
  if (activeType !== "all") filteredFiles = filteredFiles.filter(f => f.type === activeType);
  if (searchQuery) {
    filteredFiles = filteredFiles.filter(f => 
      f.name.toLowerCase().includes(searchQuery) || 
      f.folder.toLowerCase().includes(searchQuery)
    );
  }

  const handleSelect = (key: string) => {
    setSelectedFiles(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map(f => `${f.folder}/${f.name}`));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedFiles.length} files?`)) return;
    try {
      for (const key of selectedFiles) {
        const [folder, name] = key.split("/");
        await api.deleteFile(folder, name);
      }
      success(`Deleted ${selectedFiles.length} files`);
      setSelectedFiles([]);
      loadData();
    } catch {
      toastError("Error during bulk delete");
    }
  };

  const handleDelete = async (folder: string, name: string) => {
    if (!confirm("Delete this file?")) return;
    try {
      await api.deleteFile(folder, name);
      success("File deleted");
      loadData();
    } catch {
      toastError("Failed to delete file");
    }
  };

  const handleTogglePrivacy = async (file: FileData) => {
    try {
      await api.togglePrivacy(file.folder, file.name, !file.isPublic);
      success(`Privacy updated`);
      loadData();
    } catch {
      toastError("Failed to update privacy");
    }
  };

  return (
    <>
      <Topbar onRefresh={loadData} />
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Files</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage all your uploaded files.</p>
        </div>

        <FolderView folders={foldersList} activeFolder={activeFolder} onSelectFolder={setActiveFolder} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={activeType}
              onChange={e => setActiveType(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-slate-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="pdf">PDFs</option>
              <option value="document">Documents</option>
              <option value="code">Code</option>
              <option value="archive">Archives</option>
              <option value="installer">Installers</option>
              <option value="unknown">Other</option>
            </select>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {selectedFiles.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete ({selectedFiles.length})
              </button>
            )}

            <button
              onClick={handleSelectAll}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-slate-700 transition-colors"
            >
              {selectedFiles.length === filteredFiles.length && filteredFiles.length > 0 ? "Deselect All" : "Select All"}
            </button>

            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-gray-800">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-md p-1.5 transition-colors ${viewMode === "grid" ? "bg-slate-100 text-gray-900 dark:bg-slate-700 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-md p-1.5 transition-colors ${viewMode === "list" ? "bg-slate-100 text-gray-900 dark:bg-slate-700 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <FileGrid
          files={filteredFiles}
          selectedFiles={selectedFiles}
          viewMode={viewMode}
          onSelectFile={handleSelect}
          onDelete={handleDelete}
          onRename={setRenameFile}
          onMove={setMoveFile}
          onShare={setShareFile}
          onTogglePrivacy={handleTogglePrivacy}
          onPreview={setPreviewFile}
          isLoading={loading}
        />
      </div>

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      <ShareModal file={shareFile} onClose={() => setShareFile(null)} />
      <RenameModal file={renameFile} onClose={() => setRenameFile(null)} onSuccess={loadData} />
      <MoveModal file={moveFile} folders={Array.from(foldersMap.keys())} onClose={() => setMoveFile(null)} onSuccess={loadData} />
    </>
  );
}
