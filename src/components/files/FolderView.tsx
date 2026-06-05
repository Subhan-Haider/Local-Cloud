"use client";

import { Folder, X } from "lucide-react";

interface FolderViewProps {
  folders: { name: string; count: number }[];
  activeFolder: string | null;
  onSelectFolder: (folder: string | null) => void;
}

const FOLDER_COLORS = [
  "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/40",
  "bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800/40",
  "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40",
  "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40",
  "bg-pink-50 border-pink-200 dark:bg-pink-950/20 dark:border-pink-800/40",
  "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-800/40",
];

const FOLDER_ICON_COLORS = [
  "text-blue-500",
  "text-purple-500",
  "text-emerald-500",
  "text-amber-500",
  "text-pink-500",
  "text-indigo-500",
];

export function FolderView({ folders, activeFolder, onSelectFolder }: FolderViewProps) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Folders
        </h2>
        {activeFolder && (
          <button
            onClick={() => onSelectFolder(null)}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {folders.map((folder, i) => {
          const colorClass = FOLDER_COLORS[i % FOLDER_COLORS.length];
          const iconColor = FOLDER_ICON_COLORS[i % FOLDER_ICON_COLORS.length];
          const isActive = activeFolder === folder.name;
          return (
            <button
              key={folder.name}
              onClick={() => onSelectFolder(isActive ? null : folder.name)}
              className={`group flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                isActive
                  ? "border-indigo-500 bg-indigo-50 dark:border-indigo-500/60 dark:bg-indigo-950/40 shadow-sm shadow-indigo-100 dark:shadow-indigo-900/20"
                  : `${colorClass} hover:shadow-sm`
              }`}
            >
              <Folder className={`h-5 w-5 shrink-0 ${isActive ? "text-indigo-600 dark:text-indigo-400" : iconColor}`} />
              <div className="text-left">
                <p className={`text-sm font-semibold ${isActive ? "text-indigo-700 dark:text-indigo-300" : "text-gray-800 dark:text-gray-200"}`}>
                  {folder.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {folder.count} {folder.count === 1 ? "file" : "files"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
