"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderOpen,
  Files,
  UploadCloud,
  Cloud,
  Settings,
  HardDrive,
  Menu,
  Code
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Files", href: "/files", icon: Files },
  { name: "Folders", href: "/folders", icon: FolderOpen },
  { name: "Uploads", href: "/uploads", icon: UploadCloud },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Developer API", href: "/developer", icon: Code },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (pathname === "/privacy" || pathname === "/terms") {
    return null;
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-3.5 left-4 z-[60] p-1.5 rounded-lg bg-white/50 backdrop-blur-md shadow-sm border border-slate-200 dark:bg-gray-800/50 dark:border-slate-700 text-gray-600 dark:text-gray-300"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-[70] flex h-full w-64 shrink-0 flex-col border-r border-slate-200/60 bg-white dark:border-slate-800/60 dark:bg-gray-900 transition-transform duration-300 md:relative md:translate-x-0 md:z-0",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-3 px-5 border-b border-slate-200/60 dark:border-slate-800/60">
          <img src="/logo.png" alt="Logo" className="h-9 w-9 object-contain" />
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">StorageAdmin</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Personal Cloud</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Main Menu
          </p>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0 transition-colors",
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                  )}
                />
                {item.name}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Storage indicator at bottom */}
        <div className="m-3 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/40">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Storage</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/60 dark:bg-gray-800/60 overflow-hidden">
            <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
          </div>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Personal cloud storage</p>
        </div>

        {/* Legal links */}
        <div className="px-4 pb-4 flex items-center justify-center gap-3">
          <a href="/privacy" target="_blank" className="text-[10px] text-gray-400 hover:text-indigo-500 transition-colors">Privacy</a>
          <span className="text-gray-300 text-[10px]">·</span>
          <a href="/terms" target="_blank" className="text-[10px] text-gray-400 hover:text-indigo-500 transition-colors">Terms</a>
        </div>
      </div>
    </>
  );
}
