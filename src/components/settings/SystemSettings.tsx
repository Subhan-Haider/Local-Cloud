import { useEffect, useState } from "react";
import { api, NotificationPreferences } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";
import { Globe, Users, Plus, Trash2, Loader2, Bell, Link, Power, RefreshCw, AlertTriangle, Upload, Download, Trash, LogIn, Share2 } from "lucide-react";

export function SystemSettings() {
  const [origins, setOrigins] = useState<string[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    onUpload: true, onDelete: true, onLogin: true, onDownload: false, onShare: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  
  const [newOrigin, setNewOrigin] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newNotificationEmail, setNewNotificationEmail] = useState("");
  
  const [loading, setLoading] = useState(true);
  
  const [addingOrigin, setAddingOrigin] = useState(false);
  const [removingOrigin, setRemovingOrigin] = useState<string | null>(null);
  const [addingEmail, setAddingEmail] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [addingNotificationEmail, setAddingNotificationEmail] = useState(false);
  const [removingNotificationEmail, setRemovingNotificationEmail] = useState<string | null>(null);
  const [togglingNotifications, setTogglingNotifications] = useState(false);
  const [savingBaseUrl, setSavingBaseUrl] = useState(false);

  const [rebooting, setRebooting] = useState(false);
  const [shuttingDown, setShuttingDown] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"reboot" | "shutdown" | null>(null);

  const { success, error } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.systemSettings.get();
      setOrigins(data.allowedOrigins || []);
      setEmails(data.allowedEmails || []);
      setNotificationEmails(data.notificationEmails || []);
      setNotificationsEnabled(data.notificationsEnabled ?? true);
      setNotificationPreferences(data.notificationPreferences ?? { onUpload: true, onDelete: true, onLogin: true, onDownload: false, onShare: true });
      setCustomBaseUrl(data.customBaseUrl || "");
    } catch {
      error("Failed to load system settings");
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrigin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrigin.trim()) return;

    if (!newOrigin.startsWith("http://") && !newOrigin.startsWith("https://")) {
      error("Origin must start with http:// or https://");
      return;
    }

    setAddingOrigin(true);
    try {
      const data = await api.systemSettings.addOrigin(newOrigin.trim());
      setOrigins(data.allowedOrigins || []);
      setNewOrigin("");
      success("Origin added successfully");
    } catch {
      error("Failed to add origin");
    } finally {
      setAddingOrigin(false);
    }
  };

  const handleRemoveOrigin = async (origin: string) => {
    setRemovingOrigin(origin);
    try {
      const data = await api.systemSettings.removeOrigin(origin);
      setOrigins(data.allowedOrigins || []);
      success("Origin removed");
    } catch {
      error("Failed to remove origin");
    } finally {
      setRemovingOrigin(null);
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes("@")) {
      error("Please enter a valid email address");
      return;
    }

    setAddingEmail(true);
    try {
      const data = await api.systemSettings.addEmail(newEmail.trim());
      setEmails(data.allowedEmails || []);
      setNewEmail("");
      success("Authorized email added");
    } catch {
      error("Failed to add email");
    } finally {
      setAddingEmail(false);
    }
  };

  const handleRemoveEmail = async (email: string) => {
    setRemovingEmail(email);
    try {
      const data = await api.systemSettings.removeEmail(email);
      setEmails(data.allowedEmails || []);
      success("Authorized email removed");
    } catch {
      error("Failed to remove email");
    } finally {
      setRemovingEmail(null);
    }
  };

  const handleToggleNotifications = async () => {
    setTogglingNotifications(true);
    try {
      const data = await api.systemSettings.toggleNotifications(!notificationsEnabled);
      setNotificationsEnabled(data.notificationsEnabled);
      success(data.notificationsEnabled ? "Notifications enabled" : "Notifications disabled");
    } catch {
      error("Failed to toggle notifications");
    } finally {
      setTogglingNotifications(false);
    }
  };

  const handleSaveBaseUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBaseUrl(true);
    try {
      const data = await api.systemSettings.setCustomBaseUrl(customBaseUrl.trim());
      setCustomBaseUrl(data.customBaseUrl || "");
      success("Custom Base URL updated");
    } catch {
      error("Failed to update Custom Base URL");
    } finally {
      setSavingBaseUrl(false);
    }
  };

  const handleReboot = async () => {
    setConfirmAction(null);
    setRebooting(true);
    try {
      await api.system.reboot();
      success("Reboot command sent! Server will restart shortly.");
    } catch {
      error("Failed to send reboot command.");
    } finally {
      setRebooting(false);
    }
  };

  const handleShutdown = async () => {
    setConfirmAction(null);
    setShuttingDown(true);
    try {
      await api.system.shutdown();
      success("Shutdown command sent! Server will power off shortly.");
    } catch {
      error("Failed to send shutdown command.");
    } finally {
      setShuttingDown(false);
    }
  };

  const handleAddNotificationEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotificationEmail.trim() || !newNotificationEmail.includes("@")) {
      error("Please enter a valid email address");
      return;
    }

    setAddingNotificationEmail(true);
    try {
      const data = await api.systemSettings.addNotificationEmail(newNotificationEmail.trim());
      setNotificationEmails(data.notificationEmails || []);
      setNewNotificationEmail("");
      success("Notification email added");
    } catch {
      error("Failed to add notification email");
    } finally {
      setAddingNotificationEmail(false);
    }
  };

  const handleRemoveNotificationEmail = async (email: string) => {
    setRemovingNotificationEmail(email);
    try {
      const data = await api.systemSettings.removeNotificationEmail(email);
      setNotificationEmails(data.notificationEmails || []);
      success("Notification email removed");
    } catch {
      error("Failed to remove notification email");
    } finally {
      setRemovingNotificationEmail(null);
    }
  };

  const handleTogglePref = async (key: keyof NotificationPreferences) => {
    const updated = { ...notificationPreferences, [key]: !notificationPreferences[key] };
    setNotificationPreferences(updated);
    setSavingPrefs(true);
    try {
      const data = await api.systemSettings.updateNotificationPreferences(updated);
      setNotificationPreferences(data.notificationPreferences);
    } catch {
      error("Failed to save preferences");
      setNotificationPreferences(notificationPreferences); // revert on error
    } finally {
      setSavingPrefs(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Authorized Emails Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 flex flex-col min-h-[350px]">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Authorized Admins</h3>
              <p className="text-sm text-gray-500">Emails allowed to sign in</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col space-y-4">
          <div className="space-y-2 flex-1">
            {emails.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No emails allowed.</p>
            ) : (
              emails.map((e) => (
                <div key={e} className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-gray-700">
                  <span className="truncate">{e}</span>
                  <button
                    onClick={() => handleRemoveEmail(e)}
                    disabled={removingEmail === e}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove email"
                  >
                    {removingEmail === e ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddEmail} className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
            <input
              type="email"
              placeholder="admin@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={addingEmail}
              className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-400 disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={addingEmail || !newEmail.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
            >
              {addingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </form>
        </div>
      </div>

      {/* CORS Origins Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 flex flex-col min-h-[350px]">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
              <Globe className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Allowed CORS Origins</h3>
              <p className="text-sm text-gray-500">Manage dynamically allowed domains</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col space-y-4">
          <div className="space-y-2 flex-1">
            {origins.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No dynamic origins added yet.</p>
            ) : (
              origins.map((o) => (
                <div key={o} className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-gray-700">
                  <span className="truncate">{o}</span>
                  <button
                    onClick={() => handleRemoveOrigin(o)}
                    disabled={removingOrigin === o}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove origin"
                  >
                    {removingOrigin === o ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddOrigin} className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              placeholder="https://example.com"
              value={newOrigin}
              onChange={(e) => setNewOrigin(e.target.value)}
              disabled={addingOrigin}
              className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={addingOrigin || !newOrigin.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {addingOrigin ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </form>
        </div>
      </div>

      {/* Notification Emails Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 flex flex-col min-h-[350px]">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Bell className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-500">Emails to receive alerts</p>
            </div>
          </div>
          <button
            onClick={handleToggleNotifications}
            disabled={togglingNotifications}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              notificationsEnabled ? "bg-blue-600" : "bg-slate-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                notificationsEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className={`flex-1 flex flex-col space-y-4 transition-opacity ${notificationsEnabled ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
          <div className="space-y-2 flex-1">
            {notificationEmails.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No notification emails added.</p>
            ) : (
              notificationEmails.map((e) => (
                <div key={e} className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-gray-700">
                  <span className="truncate">{e}</span>
                  <button
                    onClick={() => handleRemoveNotificationEmail(e)}
                    disabled={removingNotificationEmail === e}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove email"
                  >
                    {removingNotificationEmail === e ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddNotificationEmail} className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
            <input
              type="email"
              placeholder="alert@example.com"
              value={newNotificationEmail}
              onChange={(e) => setNewNotificationEmail(e.target.value)}
              disabled={addingNotificationEmail}
              className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={addingNotificationEmail || !newNotificationEmail.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {addingNotificationEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </form>
        </div>
      </div>

      {/* Custom Base URL Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 flex flex-col min-h-[350px]">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <Link className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Custom Base URL</h3>
              <p className="text-sm text-gray-500">Domain for sharing file links</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col space-y-4 justify-between">
          <p className="text-sm text-gray-600">
            Configure the domain used when copying file links or generating QR codes. 
            Leave blank to use the default relative paths or the current browser domain.
          </p>

          <form onSubmit={handleSaveBaseUrl} className="mt-auto pt-4 flex flex-col gap-3">
            <input
              type="text"
              placeholder="https://storage.my-domain.com"
              value={customBaseUrl}
              onChange={(e) => setCustomBaseUrl(e.target.value)}
              disabled={savingBaseUrl}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={savingBaseUrl}
              className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {savingBaseUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Base URL"}
            </button>
          </form>
        </div>
      </div>

      {/* Notification Preferences Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 flex flex-col lg:col-span-3">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Bell className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Notification Events</h3>
              <p className="text-sm text-gray-500">Choose which events send an email alert</p>
            </div>
          </div>
          {savingPrefs && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 transition-opacity ${notificationsEnabled ? "" : "opacity-40 pointer-events-none"}`}>
          {([
            {
              key: "onUpload" as const, label: "File Upload", desc: "When a file is uploaded", icon: Upload,
              onBorder: "border-indigo-200", onBg: "bg-indigo-50", onIcon: "bg-indigo-100", onIconText: "text-indigo-600", onToggle: "bg-indigo-500",
            },
            {
              key: "onDelete" as const, label: "File Deleted", desc: "When a file is deleted", icon: Trash,
              onBorder: "border-red-200", onBg: "bg-red-50", onIcon: "bg-red-100", onIconText: "text-red-600", onToggle: "bg-red-500",
            },
            {
              key: "onLogin" as const, label: "Admin Login", desc: "When someone logs in", icon: LogIn,
              onBorder: "border-emerald-200", onBg: "bg-emerald-50", onIcon: "bg-emerald-100", onIconText: "text-emerald-600", onToggle: "bg-emerald-500",
            },
            {
              key: "onDownload" as const, label: "File Download", desc: "When a file is downloaded", icon: Download,
              onBorder: "border-amber-200", onBg: "bg-amber-50", onIcon: "bg-amber-100", onIconText: "text-amber-600", onToggle: "bg-amber-500",
            },
            {
              key: "onShare" as const, label: "File Shared", desc: "When a share link is created", icon: Share2,
              onBorder: "border-purple-200", onBg: "bg-purple-50", onIcon: "bg-purple-100", onIconText: "text-purple-600", onToggle: "bg-purple-500",
            },
          ]).map(({ key, label, desc, icon: Icon, onBorder, onBg, onIcon, onIconText, onToggle }) => {
            const enabled = notificationPreferences[key];
            return (
              <button
                key={key}
                onClick={() => handleTogglePref(key)}
                className={`relative flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-all ${
                  enabled ? `${onBorder} ${onBg}` : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${enabled ? onIcon : "bg-slate-100"}`}>
                    <Icon className={`h-4 w-4 ${enabled ? onIconText : "text-slate-400"}`} />
                  </div>
                  {/* Toggle pill */}
                  <div className={`h-5 w-9 rounded-full transition-colors ${enabled ? onToggle : "bg-slate-200"}`}>
                    <div className={`mt-0.5 ml-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${enabled ? "text-gray-900" : "text-gray-400"}`}>{label}</p>
                  <p className={`text-xs mt-0.5 ${enabled ? "text-gray-500" : "text-gray-300"}`}>{desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {!notificationsEnabled && (
          <p className="mt-3 text-xs text-amber-600 font-medium">⚠️ Global notifications are disabled. Enable them above to activate these events.</p>
        )}
      </div>

      {/* Server Controls Card */}
      <div className="rounded-2xl border border-red-200 bg-white shadow-sm p-6 flex flex-col min-h-[200px] lg:col-span-3">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
            <Power className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Server Controls</h3>
            <p className="text-sm text-gray-500">Reboot or shut down the server machine</p>
          </div>
        </div>

        {/* Confirmation dialog */}
        {confirmAction && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">
                {confirmAction === "reboot" ? "Confirm Reboot" : "Confirm Shutdown"}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {confirmAction === "reboot"
                  ? "The server will restart. The dashboard will be unavailable for ~30 seconds."
                  : "The server will power off completely. You will need physical access or a hosting panel to turn it back on."}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={confirmAction === "reboot" ? handleReboot : handleShutdown}
                  className={`rounded-lg px-4 py-1.5 text-sm font-semibold text-white transition-colors ${
                    confirmAction === "reboot"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Yes, {confirmAction === "reboot" ? "Reboot" : "Shut Down"} Now
                </button>
                <button
                  onClick={() => setConfirmAction(null)}
                  className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setConfirmAction("reboot")}
            disabled={rebooting || shuttingDown || !!confirmAction}
            className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-700 transition-all hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {rebooting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {rebooting ? "Rebooting…" : "Reboot Server"}
          </button>

          <button
            onClick={() => setConfirmAction("shutdown")}
            disabled={rebooting || shuttingDown || !!confirmAction}
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition-all hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {shuttingDown ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
            {shuttingDown ? "Shutting Down…" : "Shut Down Server"}
          </button>
        </div>
      </div>

    </div>
  );
}
