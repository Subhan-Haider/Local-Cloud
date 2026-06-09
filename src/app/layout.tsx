import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AuthGate } from "@/components/auth/AuthGate";
import { ToastProvider } from "@/components/ui/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Storage Admin",
  description: "Storage Server Admin Dashboard",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className={`h-full flex overflow-hidden bg-slate-100`} suppressHydrationWarning>
        <ToastProvider>
          <AuthGate>
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </AuthGate>
        </ToastProvider>
      </body>
    </html>
  );
}
