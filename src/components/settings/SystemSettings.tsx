import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";
import { Globe, Users, Plus, Trash2, Loader2, Bell, Link } from "lucide-react";

export function SystemSettings() {
  const [origins, setOrigins] = useState<string[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
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

    </div>
  );
}
