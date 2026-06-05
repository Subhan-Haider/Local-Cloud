"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { FolderPlus, Folder, Trash2 } from "lucide-react";
import { api, SystemStats } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";
import Link from "next/link";

export default function FoldersPage() {
  const { success, error: toastError } = useToast();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newFolder, setNewFolder] = useState("");
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const statsData = await api.getStats();
      setStats(statsData);
    } catch (err) {
      toastError("Failed to load folders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolder.trim()) return;
    setCreating(true);
    try {
      await api.createFolder(newFolder.trim());
      success("Folder created");
      setNewFolder("");
      loadData();
    } catch {
      toastError("Failed to create folder");
    } finally {
      setCreating(false);
    }
  };

  const folders = stats?.foldersBreakdown ? Object.entries(stats.foldersBreakdown) : [];

  return (
    <>
      <Topbar onRefresh={loadData} />
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Folders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your directories.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-gray-900">
          <form onSubmit={handleCreate} className="flex gap-3 max-w-md">
            <input
              type="text"
              placeholder="New folder name..."
              value={newFolder}
              onChange={e => setNewFolder(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={creating || !newFolder.trim()}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              <FolderPlus className="h-4 w-4" />
              Create
            </button>
          </form>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-gray-900" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map(([name, data]) => (
              <Link
                key={name}
                href={`/files?q=${name}`}
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-gray-900 dark:hover:border-indigo-700 transition-all card-hover"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/30">
                    <Folder className="h-6 w-6 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {data.count} files · {(data.sizeBytes / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            {folders.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <Folder className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No folders exist yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
