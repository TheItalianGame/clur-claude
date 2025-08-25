import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { ThemeProvider } from "./theme-provider";
import { ThemeButton } from "@/components/theme-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CLUR",
  description: "Electronic Health Records Calendar Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <div className="flex h-screen bg-white dark:bg-gray-900">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900">
              {children}
            </main>
          </div>
          <ThemeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
