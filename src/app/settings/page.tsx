"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Shield, Activity, User, Mail, LogOut, Loader2, Clock, Settings } from "lucide-react";
import { AuditLog } from "@/lib/api";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { ChangePassword } from "@/components/settings/ChangePassword";
import { TwoFactorSetup } from "@/components/settings/TwoFactorSetup";
import { SystemSettings } from "@/components/settings/SystemSettings";

export default function SettingsPage() {
  const { error: toastError } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  const loadData = async () => {
    setLoading(true);
    try {
      const logsData = await api.getLogs();
      setLogs(logsData);
    } catch {
      toastError("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const handleSignOut = async () => {
    await api.mfa.logout().catch(() => {});
    await signOut(auth);
  };

  return (
    <>
      <Topbar onRefresh={loadData} />
      <div className="min-h-full bg-slate-100 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-4xl space-y-8">

          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings &amp; Security</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your account, security, and activity.</p>
          </div>

          {/* Profile Card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                {user?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="avatar" className="h-14 w-14 rounded-2xl object-cover ring-2 ring-indigo-500/30" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-bold text-white">
                    {(user?.displayName ?? user?.email ?? "A")[0].toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {user?.displayName ?? "Admin"}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{user?.email}</span>
                </div>
                {user?.emailVerified !== undefined && (
                  <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    user.emailVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {user.emailVerified ? "✓ Email verified" : "⚠ Email not verified"}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                  Admin
                </span>
                <button
                  onClick={handleSignOut}
                  title="Sign out"
                  className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:border-red-300 hover:bg-red-100 transition-all"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-500" />
              <h2 className="text-base font-semibold text-gray-900">Security</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChangePassword />
              <TwoFactorSetup />
            </div>
          </div>

          {/* System Configuration */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-500" />
              <h2 className="text-base font-semibold text-gray-900">System Configuration</h2>
            </div>
            <SystemSettings />
          </div>

          {/* Activity Logs */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                </div>
              ) : logs.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
                  <Activity className="h-7 w-7 text-slate-300" />
                  <p className="text-sm text-gray-400">No activity yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {logs.slice(0, 20).map((log) => (
                    <div key={log.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                        <User className="h-3.5 w-3.5 text-indigo-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{log.event}</p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <p className="mt-0.5 truncate text-xs text-gray-400">
                            {Object.entries(log.details)
                              .map(([k, v]) => `${k}: ${String(v)}`)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {formatDate(log.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
