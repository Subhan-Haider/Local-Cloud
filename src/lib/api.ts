import axios from "axios";
import { auth } from "./firebase";

// When deployed on Vercel: leave NEXT_PUBLIC_API_URL empty (or unset) and Next.js
// rewrites in next.config.ts will proxy all API calls to the Express server.
// When self-hosted (VPS): set NEXT_PUBLIC_API_URL to the Express server URL (e.g. https://server.lootops.me)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export const apiInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Always send cookies (needed for MFA token)
});


// Attach Firebase ID token to every request
apiInstance.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  // Attach MFA token from localStorage as a header fallback
  // (needed when Vercel proxy strips Set-Cookie headers from Express responses)
  if (typeof window !== "undefined") {
    const mfaToken = localStorage.getItem("mfa_token");
    if (mfaToken) {
      config.headers["x-mfa-token"] = mfaToken;
    }
  }
  return config;
});

/** Get a fresh Firebase ID token (for use in image src URLs) */
export async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

// ==============================
// TYPES
// ==============================
export interface FileData {
  name: string;
  folder: string;
  url: string;
  thumbnailUrl: string | null;
  size: number;
  type: "image" | "video" | "audio" | "pdf" | "code" | "archive" | "installer" | "unknown";
  createdAt: string;
  isPublic: boolean;
  downloads: number;
  pinned?: boolean;
  expiresAt?: string | null;
  hash?: string | null;
  tags?: string[];
  note?: string;
}

export interface SystemStats {
  totalFiles: number;
  totalFolders: number;
  totalSizeMB: string;
  mostUploadedFolder: string;
  filesByType: Record<string, number>;
  foldersBreakdown: Record<string, { count: number; sizeBytes: number }>;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  event: string;
  details: Record<string, unknown>;
}

export interface AdminUser {
  username: string;
  apiKey: string;
}

// ==============================
// API METHODS
// ==============================

export interface SystemSettingsData {
  allowedOrigins: string[];
  allowedEmails: string[];
  notificationEmails: string[];
  notificationsEnabled: boolean;
  customBaseUrl?: string;
}
export const api = {
  // Files
  getFiles: async (): Promise<FileData[]> => {
    const { data } = await apiInstance.get("/admin/files");
    return data.map((f: FileData) => ({
      ...f,
      url: f.url.startsWith("http") ? f.url : `${API_BASE}${f.url}`,
      thumbnailUrl: f.thumbnailUrl ? (f.thumbnailUrl.startsWith("http") ? f.thumbnailUrl : `${API_BASE}${f.thumbnailUrl}`) : null
    }));
  },

  getStats: async (): Promise<SystemStats> => {
    const { data } = await apiInstance.get("/admin/stats");
    return data;
  },

  deleteFile: async (folder: string, name: string): Promise<void> => {
    await apiInstance.delete("/admin/file", { data: { folder, name } });
  },

  uploadFile: async (
    file: File,
    folder: string,
    onProgress?: (pct: number) => void
  ): Promise<FileData> => {
    const formData = new FormData();
    formData.append("folder", folder);
    formData.append("file", file);
    const { data } = await apiInstance.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
    return {
      ...data,
      url: data.url.startsWith("http") ? data.url : `${API_BASE}${data.url}`,
      thumbnailUrl: data.thumbnailUrl ? (data.thumbnailUrl.startsWith("http") ? data.thumbnailUrl : `${API_BASE}${data.thumbnailUrl}`) : null
    };
  },

  // Folder ops
  createFolder: async (folder: string): Promise<void> => {
    await apiInstance.post("/create-folder", { folder });
  },

  // File ops
  renameFile: async (oldPath: string, newPath: string): Promise<void> => {
    await apiInstance.post("/rename", { oldPath, newPath });
  },

  moveFile: async (
    file: string,
    sourceFolder: string,
    destinationFolder: string
  ): Promise<void> => {
    await apiInstance.post("/move-file", { file, sourceFolder, destinationFolder });
  },

  togglePrivacy: async (
    folder: string,
    name: string,
    isPublic: boolean
  ): Promise<void> => {
    await apiInstance.post("/admin/toggle-privacy", { folder, name, isPublic });
  },

  createShare: async (
    folder: string,
    name: string,
    durationMs: number | null,
    password?: string
  ): Promise<string> => {
    const { data } = await apiInstance.post("/admin/create-share", {
      folder,
      name,
      durationMs,
      password,
    });
    return data.shareUrl;
  },

  sendShareEmail: async (
    folder: string,
    name: string,
    email: string,
    url: string,
    attachFile: boolean = false
  ): Promise<void> => {
    await apiInstance.post("/admin/share/email", { folder, name, email, url, attachFile });
  },

  bulkShareEmail: async (
    files: { folder: string; name: string }[],
    email: string,
    durationMs: number | null,
    password?: string
  ): Promise<{ success: boolean; count: number }> => {
    const { data } = await apiInstance.post("/admin/bulk-share-email", {
      files,
      email,
      durationMs,
      password,
    });
    return data;
  },

  // Logs
  getLogs: async (): Promise<AuditLog[]> => {
    const { data } = await apiInstance.get("/admin/logs");
    return data;
  },

  // Users
  getUsers: async (): Promise<AdminUser[]> => {
    const { data } = await apiInstance.get("/admin/users");
    return data;
  },

  createUser: async (username: string): Promise<{ username: string; apiKey: string }> => {
    const { data } = await apiInstance.post("/admin/users", { username });
    return data;
  },

  deleteUser: async (username: string): Promise<void> => {
    await apiInstance.delete(`/admin/users/${username}`);
  },

  getDeveloperConfig: async (): Promise<{ apiKey: string; baseUrl: string }> => {
    const { data } = await apiInstance.get("/admin/developer");
    return data;
  },

  // ── NEW ENDPOINTS ──────────────────────────────────────────────

  bulkDelete: async (files: { folder: string; name: string }[]): Promise<{ deleted: number }> => {
    const { data } = await apiInstance.post("/admin/bulk-delete", { files });
    return data;
  },

  bulkMove: async (files: { folder: string; name: string }[], destinationFolder: string): Promise<{ moved: number }> => {
    const { data } = await apiInstance.post("/admin/bulk-move", { files, destinationFolder });
    return data;
  },

  bulkTogglePin: async (files: { folder: string; name: string }[], isPinned: boolean): Promise<void> => {
    await apiInstance.post("/admin/bulk-pin", { files, isPinned });
  },

  bulkTogglePrivacy: async (files: { folder: string; name: string }[], isPublic: boolean): Promise<void> => {
    await apiInstance.post("/admin/bulk-privacy", { files, isPublic });
  },

  bulkSetExpiry: async (files: { folder: string; name: string }[], expiresAt: string | null): Promise<void> => {
    await apiInstance.post("/admin/bulk-expiry", { files, expiresAt });
  },

  deleteFolder: async (folder: string): Promise<void> => {
    await apiInstance.delete("/admin/folder", { data: { folder } });
  },

  renameFolder: async (oldName: string, newName: string): Promise<void> => {
    await apiInstance.post("/admin/rename-folder", { oldName, newName });
  },

  copyFile: async (file: string, sourceFolder: string, destinationFolder: string): Promise<{ newName: string }> => {
    const { data } = await apiInstance.post("/admin/copy-file", { file, sourceFolder, destinationFolder });
    return data;
  },

  searchFiles: async (q: string, type?: string, folder?: string): Promise<FileData[]> => {
    const { data } = await apiInstance.get("/admin/search", { params: { q, type, folder } });
    return data.map((f: FileData) => ({
      ...f,
      url: f.url.startsWith("http") ? f.url : `${API_BASE}${f.url}`,
      thumbnailUrl: f.thumbnailUrl ? (f.thumbnailUrl.startsWith("http") ? f.thumbnailUrl : `${API_BASE}${f.thumbnailUrl}`) : null
    }));
  },

  updateFileMeta: async (folder: string, name: string, tags?: string[], note?: string): Promise<void> => {
    await apiInstance.post("/admin/file-meta", { folder, name, tags, note });
  },

  saveFileContent: async (folder: string, name: string, content: string): Promise<void> => {
    await apiInstance.post("/admin/save-file", { folder, name, content });
  },

  runPython: async (folder: string, name: string): Promise<{ output: string; error: string; exitCode: number }> => {
    const { data } = await apiInstance.post("/admin/run-python", { folder, name });
    return data;
  },

  cleanupStorage: async (): Promise<{ orphansRemoved: number }> => {
    const { data } = await apiInstance.post("/admin/cleanup");
    return data;
  },

  getRecentFiles: async (limit = 20): Promise<FileData[]> => {
    const { data } = await apiInstance.get("/admin/recent", { params: { limit } });
    return data.map((f: FileData) => ({
      ...f,
      url: f.url.startsWith("http") ? f.url : `${API_BASE}${f.url}`,
      thumbnailUrl: f.thumbnailUrl ? (f.thumbnailUrl.startsWith("http") ? f.thumbnailUrl : `${API_BASE}${f.thumbnailUrl}`) : null
    }));
  },

  getDiskInfo: async (): Promise<{
    totalBytes: number; totalMB: string; totalFiles: number;
    typeBreakdown: Record<string, number>; folderBreakdown: Record<string, { count: number; bytes: number }>;
  }> => {
    const { data } = await apiInstance.get("/admin/disk-info");
    return data;
  },

  clearLogs: async (): Promise<void> => {
    await apiInstance.delete("/admin/logs");
  },

  getTrash: async (): Promise<any[]> => {
    const { data } = await apiInstance.get("/admin/trash");
    return data;
  },

  restoreFromTrash: async (trashedName: string): Promise<void> => {
    await apiInstance.post("/admin/trash/restore", { trashedName });
  },

  emptyTrash: async (): Promise<void> => {
    await apiInstance.delete("/admin/trash/empty");
  },

  togglePin: async (folder: string, name: string): Promise<boolean> => {
    const { data } = await apiInstance.post("/admin/toggle-pin", { folder, name });
    return data.pinned;
  },

  updateFolderMeta: async (folder: string, color: string, icon: string, note?: string): Promise<void> => {
    await apiInstance.post("/admin/folder-meta", { folder, color, icon, note });
  },

  setFileExpiry: async (folder: string, name: string, expiresAt: string | null): Promise<string | null> => {
    const { data } = await apiInstance.post("/admin/set-expiry", { folder, name, expiresAt });
    return data.expiresAt;
  },

  configureWebhook: async (webhookUrl: string): Promise<string> => {
    const { data } = await apiInstance.post("/admin/webhook-config", { webhookUrl });
    return data.webhookUrl;
  },

  getWebhookUrl: async (): Promise<string> => {
    const { data } = await apiInstance.get("/admin/webhook-config");
    return data.webhookUrl;
  },

  verifyFileIntegrity: async (folder: string, name: string): Promise<{ intact: boolean; calculatedHash: string; storedHash: string; size: number }> => {
    const { data } = await apiInstance.get("/admin/file-integrity", { params: { folder, name } });
    return data;
  },

  zipFiles: async (files: { folder: string; name: string }[], zipName?: string): Promise<Blob> => {
    const { data } = await apiInstance.post("/admin/zip", { files, zipName }, { responseType: "blob" });
    return data;
  },

  // ── SYSTEM SETTINGS ────────────────────────────────────────────────────────
  systemSettings: {
    get: async (): Promise<SystemSettingsData> => {
      const { data } = await apiInstance.get("/admin/settings");
      return data;
    },
    addOrigin: async (origin: string): Promise<{ success: boolean; allowedOrigins: string[] }> => {
      const { data } = await apiInstance.post("/admin/settings/origins", { origin });
      return data;
    },
    removeOrigin: async (origin: string): Promise<{ success: boolean; allowedOrigins: string[] }> => {
      const { data } = await apiInstance.delete("/admin/settings/origins", { data: { origin } });
      return data;
    },
    addEmail: async (email: string): Promise<{ success: boolean; allowedEmails: string[] }> => {
      const { data } = await apiInstance.post("/admin/settings/emails", { email });
      return data;
    },
    removeEmail: async (email: string): Promise<{ success: boolean; allowedEmails: string[] }> => {
      const { data } = await apiInstance.delete("/admin/settings/emails", { data: { email } });
      return data;
    },
    toggleNotifications: async (enabled: boolean): Promise<{ success: boolean; notificationsEnabled: boolean }> => {
      const { data } = await apiInstance.post("/admin/settings/notifications/toggle", { enabled });
      return data;
    },
    addNotificationEmail: async (email: string): Promise<{ success: boolean; notificationEmails: string[] }> => {
      const { data } = await apiInstance.post("/admin/settings/notifications/emails", { email });
      return data;
    },
    removeNotificationEmail: async (email: string): Promise<{ success: boolean; notificationEmails: string[] }> => {
      const { data } = await apiInstance.delete("/admin/settings/notifications/emails", { data: { email } });
      return data;
    },
    setCustomBaseUrl: async (customBaseUrl: string): Promise<{ success: boolean; customBaseUrl: string }> => {
      const { data } = await apiInstance.post("/admin/settings/base-url", { customBaseUrl });
      return data;
    }
  },

  // ── 2FA / MFA ──────────────────────────────────────────────────────────────
  mfa: {
    /** Check if the current user has 2FA enabled (before full auth) */
    status: async (): Promise<{ mfaEnabled: boolean; mfaMethod: "app" | "email" | null }> => {
      const { data } = await apiInstance.get("/api/auth/2fa/status");
      return data;
    },

    /** Generate a TOTP secret + QR code PNG (base64 data URL) */
    generate: async (): Promise<{ secret: string; qrCode: string }> => {
      const { data } = await apiInstance.post("/api/auth/2fa/generate");
      return data;
    },

    /** Generate and send a 6-digit code via email */
    sendEmailCode: async (): Promise<void> => {
      await apiInstance.post("/api/auth/2fa/send-email");
    },

    /** Verify the 6-digit code and permanently enable 2FA for the user */
    verifySetup: async (token: string, secret?: string, method: "app" | "email" = "app"): Promise<void> => {
      await apiInstance.post("/api/auth/2fa/verify-setup", { token, secret, method });
    },

    /** Disable 2FA (requires valid 6-digit code to confirm) */
    disable: async (token: string): Promise<void> => {
      await apiInstance.post("/api/auth/2fa/disable", { token });
    },

    /** Submit a 6-digit login code to receive the MFA session cookie */
    login: async (code: string): Promise<void> => {
      const { data } = await apiInstance.post("/api/auth/2fa/login", { code }, { withCredentials: true });
      // Also store in localStorage as fallback when Vercel proxy strips Set-Cookie
      if (data.mfaToken && typeof window !== "undefined") {
        localStorage.setItem("mfa_token", data.mfaToken);
      }
    },

    /** Clear the MFA session cookie on logout */
    logout: async (): Promise<void> => {
      await apiInstance.post("/api/auth/logout", {}, { withCredentials: true });
      if (typeof window !== "undefined") {
        localStorage.removeItem("mfa_token");
      }
    },
  },

  // ── ALERTS ─────────────────────────────────────────────────────────────────
  alerts: {
    /** Trigger an admin login alert email */
    login: async (): Promise<void> => {
      await apiInstance.post("/api/alerts/login");
    },
    /** Trigger a website visit alert email (rate limited on server) */
    visit: async (): Promise<void> => {
      await apiInstance.post("/api/alerts/visit").catch(() => {});
    }
  },

  // ── Python Studio ────────────────────────────────────────────────────────────
  /** List all files in a specific folder */
  getFolderFiles: async (folder: string): Promise<FileData[]> => {
    const { data } = await apiInstance.get("/admin/files");
    return (data as FileData[])
      .filter((f: FileData) => f.folder === folder)
      .map((f: FileData) => ({
        ...f,
        url: f.url.startsWith("http") ? f.url : `${API_BASE}${f.url}`,
        thumbnailUrl: f.thumbnailUrl
          ? f.thumbnailUrl.startsWith("http") ? f.thumbnailUrl : `${API_BASE}${f.thumbnailUrl}`
          : null,
      }));
  },

  /** Fetch the raw text content of a file (authenticated) */
  getFileContent: async (folder: string, name: string): Promise<string> => {
    const { data } = await apiInstance.get("/admin/file-content", {
      params: { folder, name },
      responseType: "text",
    });
    return typeof data === "string" ? data : JSON.stringify(data);
  },

  // ── SYSTEM CONTROLS ──────────────────────────────────────────────────────────
  system: {
    reboot: async (): Promise<{ success: boolean; message: string }> => {
      const { data } = await apiInstance.post("/admin/system/reboot");
      return data;
    },
    shutdown: async (): Promise<{ success: boolean; message: string }> => {
      const { data } = await apiInstance.post("/admin/system/shutdown");
      return data;
    },
  },
};

